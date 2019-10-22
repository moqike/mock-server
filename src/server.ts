import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router, { RouterContext } from 'koa-router';
import cors from '@koa/cors';
import multer from 'koa-multer';
import fs from 'fs';
import { Server } from 'http';
import { Server as HttpsServer } from 'https';
import pathToRegexp from 'path-to-regexp';
import rp from 'request-promise';
import http from 'http';
import https from 'https';
import path from 'path';
import chalk from 'chalk';
import { Validator as JsonSchemaValidator } from 'jsonschema';

import { Route, ProxySetting, HTTP_METHOD, HttpsOptions,
  GlobalConfig, ControllerSetting, PresetSetting, ScenarioSetting,
  Validator } from './types';
import { sleep, validate } from './util';

const runtimePath = path.resolve('./');

export interface MockServerOptions {
  /**
   * Absolute path of mock data folder
   */
  mockHome?: string;
  https?: boolean;
  httpsOptions?: HttpsOptions;
}

interface ScenarioMap {
  [key: string]: string | string[];
}

const DEFAULT_SUCCESS_STATUS = 200;
const DEFAULT_FAIL_STATUS = 500;

export class MockServer {
  private _app: Koa = new Koa();
  private _router: Router = new Router();
  private _mockHome: string;
  private _server: Server | HttpsServer | null = null;
  private _scenarioMap: ScenarioMap = {};
  private _tmpScenarioMap: ScenarioMap = {};
  private _https: boolean = false;
  private _httpsOptions: HttpsOptions | null | undefined = null;
  private _globalConfig: GlobalConfig = {};
  private _multer: multer.Instance;

  constructor(options: MockServerOptions) {
    this._mockHome = (options.mockHome || process.env.MOCK_HOME || runtimePath) as string;
    this._https = !!options.https;
    this._httpsOptions = options.httpsOptions;
    this._app.use(bodyParser({
      enableTypes: ['json', 'form', 'text']
    }));
    this._enableCORS();
    this._initUploadFolder();
    const routeFiles = fs.readdirSync(`${this._mockHome}/routing`);
    if (routeFiles) {
      routeFiles.forEach((routeFileName) => {
        this._configRoute(routeFileName);
      });
    }
    try {
      this._globalConfig = require(`${this._mockHome}/msconfig.json`);
    } catch (e) {
      console.log(chalk.red('msconfig.json does not exist under mock_home'));
    }
    this._registerPublicApi();
    this._app.use(this._router.routes());
    if (fs.existsSync(`${this._mockHome}/preset/.tmp.ts`)) {
      console.log(chalk.green('cached preset file is loaded'));
      this.loadPreset('.tmp');
    }
  }

  listen(...args: any[]): Server | HttpsServer {
    this.close();
    let server: Server | HttpsServer;
    if (this._https) {
      server = https.createServer(this._httpsOptions as HttpsOptions, this._app.callback());
      server = server.listen.apply(server, args);
    } else {
      server = http.createServer(this._app.callback());
      server = server.listen.apply(server, args);
    }
    this._server = server;
    return server;
  }

  close(...args: any[]): Server | void {
    if (this._server) {
      const result = this._server.close.apply(this._server, args);
      this._server = null;
      return result;
    }
  }

  useScenario(api: string, scenario: ScenarioSetting, saveToCache: boolean = true) {
    if (!scenario) {
      scenario = this._getDefaultScenario(api);
    }
    console.log(`use-scenario [${scenario}] for api [${api}] `);
    this._scenarioMap[api] = [].concat(scenario);
    this._tmpScenarioMap[api] = [].concat(scenario);
    if (saveToCache) {
      // save all used scenarios to tmp preset file which will be loaded after reboot
      this.saveAsPreset('.tmp', true);
    }
  }

  loadPreset(preset: string) {
    const presetSetting: PresetSetting = require(`${this._mockHome}/preset/${preset}`).default;
    // tslint:disable-next-line:forin
    const keys = Object.keys(presetSetting);
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      if (i != len -1) {
        this.useScenario(key, presetSetting[key], false);
      } else {
        // do not write to cache file until load the last preset rule
        this.useScenario(key, presetSetting[key]);
      }
    }
  }

  saveAsPreset(preset: string, overwrite: boolean = false): boolean {
    const presetContent = `export default ${JSON.stringify(this._tmpScenarioMap, null, 2)}`;
    const filePath = `${this._mockHome}/preset/${preset}.ts`;
    if (!overwrite && fs.existsSync(filePath)) {
      return false;
    } else {
      fs.writeFileSync(filePath, presetContent);
      return true;
    }
  }

  private _configRoute(routeFileName: string): void {
    const routeSetting: Route = require(`${this._mockHome}/routing/${routeFileName}`).default;
    const routeList: Route[] = Array.isArray(routeSetting) ? routeSetting : [routeSetting];
    routeList.forEach((route) => {
      let methods = [HTTP_METHOD.GET];
      if (route.methods && route.methods.length) {
        methods = route.methods;
      }

      methods.forEach((method) => {
        let routePathArray: string | string[] = route.path;
        if (!Array.isArray(routePathArray)) {
          routePathArray = [routePathArray];
        }
        this._registerRouteController(method, routePathArray, route.controller);
      });
    });
  }

  private _initUploadFolder() {
    const relativePath = this._globalConfig.uploadFolder || './upload';
    const dest = path.resolve(this._mockHome, relativePath);
    if (!fs.existsSync(dest)) {
      console.log(`created upload folder: ${dest}`)
      fs.mkdirSync(dest);
    };
    this._multer = multer({
      dest
    });
  }

  private _getDefaultScenario(controllerPath: string): string {
    const scenario = require(`${this._mockHome}/data/${controllerPath}/_default`).default;
    return scenario;
  }

  private _registerRouteController(method: string, routePathArray: string[], controllerPath: string ): void {
    const absoluteControllerPath = `${this._mockHome}/data/${controllerPath}`;
    const wrappedController = async (ctx: RouterContext, next) => {
      let scenario = this._scenarioMap[controllerPath];
      const isEmptyArray = Array.isArray(scenario) && scenario.length === 0;
      if (!scenario || isEmptyArray) {
        scenario = this._getDefaultScenario(controllerPath);
        this._scenarioMap[controllerPath] = scenario;
      }
      scenario = Array.isArray(scenario) ? scenario : [scenario];
      const currentScenario: string = scenario.shift() as string;
      if (scenario.length === 0) {
        scenario.push(currentScenario);
      }
      const controller = require(`${absoluteControllerPath}/${currentScenario}`).default;
      if (typeof controller === 'object') {
        if (controller.proxy) {
          await this._useProxy(controller, ctx, next);
        } else {
          await this._handleControllerSetting(controller, ctx);
        }
      } else if (typeof controller === 'function') {
        try {
          const result = await controller(ctx, next, this);
          await this._handleControllerSetting(result, ctx);
        } catch (e) {
          await this._handleControllerSetting({
            data: e.data,
            status: e.status || DEFAULT_FAIL_STATUS
          }, ctx);
        }
      }
    };

    routePathArray.forEach((routePath) => {
      console.log(`[${method}]: ${routePath} -> ${controllerPath}`);
      this._router[method.toLowerCase()](routePath, this._multer.any(), wrappedController);
    });

  }

  private async _handleControllerSetting(controllerSetting: ControllerSetting,
    ctx: RouterContext
    ) {
    // handle delay
    if (controllerSetting.delay) {
      await sleep(controllerSetting.delay);
    } else if (this._globalConfig.delay) {
      let delay: number = null;
      if (Number.isInteger(this._globalConfig.delay as number)) {
        delay = this._globalConfig.delay as number;
      } else if ((this._globalConfig.delay as any).max > (this._globalConfig.delay as any).min) {
        const delayRange: any = this._globalConfig.delay;
        delay = delayRange.min + Math.floor(Math.random() * (delayRange.max - delayRange.min));
      }
      if (delay) {
        await sleep(delay);
      }
    }

    // validate
    let validationResult = {
      isValid: true,
      status: null
    };
    if (controllerSetting.validators && controllerSetting.validators.length) {
      validationResult = this._validateRequest(ctx, controllerSetting.validators);
    }

    // handle useScenario
    if (controllerSetting.useScenario) {
      controllerSetting.useScenario.forEach((useScenarioSetting) => {
        this.useScenario(useScenarioSetting.api, useScenarioSetting.scenario);
      });
    }

    // set data & status
    if (validationResult.isValid) {
      ctx.status = controllerSetting.status || DEFAULT_SUCCESS_STATUS;
      ctx.body = controllerSetting.data;
    } else {
      ctx.status = validationResult.status;
    }
  }

  private _validateRequest(ctx: RouterContext<{}, {}>, validators: Validator[]): {
    isValid: boolean,
    status: number
  } {
    function getValidateResult(isValid: boolean, status?: number, message?: string) {
      if (message) {
        console.log(chalk.red(message));
      }
      return {
        isValid,
        status: isValid ? null : (status || 400)
      }
    }

    for (const validator of validators) {
      if (validator.rule) {
        const rule = validator.rule;
        const requiredHeaders = rule.headers || {};
        // check headers
        for (const header in requiredHeaders) {
          const headerLowerCase = header.toLowerCase();
          if ((headerLowerCase in ctx.headers)) {
            if (!validate(ctx.headers[headerLowerCase], requiredHeaders[header])) {
              return getValidateResult(false, validator.status,
                `Wrong header ${header} value. expected: ${requiredHeaders[header]} , get: ${ctx.headers[headerLowerCase]}`);
            }
          } else {
            return getValidateResult(false, validator.status, `Required header: ${header} not found`);
          }
        }
        // check body
        if (rule.body) {
          if (rule.body.type === 'json'
            || rule.body.type === 'form') {
            const jsonSchemaValidator = new JsonSchemaValidator();
            if (rule.body.refs) {
              rule.body.refs.forEach((ref) => {
                console.log(`add refs ${ref.id}`);
                jsonSchemaValidator.addSchema(ref, ref.id);
              });
            }
            const schemaValidationResult = jsonSchemaValidator.validate(ctx.request.body, rule.body.schema);
            if (!schemaValidationResult.valid) {
              return getValidateResult(false, validator.status,
                `Schema validation failed: \n ${schemaValidationResult.errors.join('\n')}`);
            };
          } else if (rule.body.type === 'text') {
            if (!validate(ctx.request.body, rule.body.pattern)) {
              return getValidateResult(false, validator.status,
                `Text pattern validation failed. expected: ${rule.body.pattern} , get: ${ctx.request.body} `);
            };
          }
        }
      }
    }
    return getValidateResult(true);
  }

  private async _useProxy(proxySetting: ProxySetting, ctx, next) {
    const toPath = pathToRegexp.compile(proxySetting.path);
    const targetPath = toPath(ctx.params);
    // TODO: refine proxy support for `multipart`
    try {
      const protocal = proxySetting.protocal || 'http';
      const portInfo = proxySetting.port ? `:${proxySetting.port}` : '';
      console.log(`proxy to:${protocal}://${proxySetting.host}${portInfo}${targetPath}`);

      const proxyHeaderBlackList = this._globalConfig.proxyHeaderBlackList || [];
      const requestHeaders = {
        ...ctx.request.headers
      };
      proxyHeaderBlackList.forEach((notAllowedProxyHeader) => {
        delete requestHeaders[notAllowedProxyHeader];
      });
      const result = await rp({
        url: `${protocal}://${proxySetting.host}${portInfo}${targetPath}`,
        method: ctx.request.method,
        headers: {
          ...requestHeaders,
          host: proxySetting.host
        },
        qs: ctx.request.query,
        body: ctx.request.rawBody,
        resolveWithFullResponse: true
      });
      ctx.set(result.headers);
      ctx.response.body = result.body;
      ctx.status = result.statusCode;
    } catch (e) {
      // TODO: handle error better, for ECONNREFUSED
      ctx.set(e.headers);
      ctx.response.body = e.response.body;
      ctx.status = e.statusCode;
    }
  }

  private _registerPublicApi(): void {
    this._router.post('/_api/use-scenario', async (ctx, next) => {
      const request = ctx.request;
      const api = request.body.api;
      const scenario = request.body.scenario;
      this.useScenario(api, scenario);
      ctx.status = 200;
      ctx.response.body = {
        scenario
      };
    });

    this._router.post('/_api/load-preset', async (ctx, next) => {
      const request = ctx.request;
      const preset = request.body.preset;
      this.loadPreset(preset);
      ctx.status = 200;
      ctx.response.body = {
        preset
      };
    });

    this._router.post('/_api/state-scenario', async (ctx, next) => {
      const request = ctx.request;
      const api = request.body.api;
      console.log(`state-scenario for api [${api}] `);
      let scenario;
      if (this._scenarioMap[api]) {
        scenario = this._scenarioMap[api];
      } else {
        scenario = this._getDefaultScenario(api);
      }
      ctx.status = 200;
      ctx.response.body = {
        scenario
      };
    });

    this._router.post('/_api/save-preset', async (ctx, next) => {
      const request = ctx.request;
      const presetName = request.body.presetName;
      // TODO: allow user to choose ts or js
      const presetContent = `export default ${JSON.stringify(this._tmpScenarioMap, null, 2)}`;
      const filePath = `${this._mockHome}/preset/${presetName}.ts`;
      const result = this.saveAsPreset(presetName);
      if (!result) {
        const errorMessage = `preset file ${presetName}.ts already exists!`;
        console.error(errorMessage);
        ctx.status = 500;
        ctx.response.body = {
          message: errorMessage
        };
      } else {
        console.log(`save-preset to ${presetName}.ts`);
        ctx.status = 200;
        ctx.response.body = {
          ...this._tmpScenarioMap
        };
      }
    });
  }

  private _enableCORS(): void {
    this._app.use(cors({
      credentials: true
    }));
  }
}





