import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import cors from '@koa/cors';
import fs from 'fs';
import { Server } from 'http';
import { Server as HttpsServer } from 'https';
import pathToRegexp from 'path-to-regexp';
import rp from 'request-promise';
import http from 'http';
import https from 'https';
import path from 'path';

import { Route, ProxySetting, HTTP_METHOD, HttpsOptions, ControllerSetting } from './types';
import { sleep } from './util';

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
  [key: string]: string;
}

const DEFAULT_SUCCESS_STATUS = 200;
const DEFAULT_FAIL_STATUS = 500;

export class MockServer {
  private _app: Koa = new Koa();
  private _router: Router = new Router();
  private _mockHome: string;
  private _server: Server | HttpsServer | null = null;
  private _scenarioMap: ScenarioMap = {};
  private _https: boolean = false;
  private _httpsOptions: HttpsOptions | null | undefined = null;

  constructor(options: MockServerOptions) {
    this._mockHome = (options.mockHome || process.env.MOCK_HOME || runtimePath) as string;
    this._https = !!options.https;
    this._httpsOptions = options.httpsOptions;
    this._app.use(bodyParser());
    this._enableCORS();
    const routeFiles = fs.readdirSync(`${this._mockHome}/routing`);
    if (routeFiles) {
      routeFiles.forEach((routeFileName) => {
        this._configRoute(routeFileName);
      });
    }
    this._registerPublicApi();
    this._app.use(this._router.routes());
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

  useScenario(api, scenario) {
    if (!scenario) {
      scenario = this._getDefaultScenario(api);
    }
    console.log(`use-scenario [${scenario}] for api [${api}] `);
    this._scenarioMap[api] = scenario;
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

  private _getDefaultScenario(controllerPath: string): string {
    const scenario = require(`${this._mockHome}/data/${controllerPath}/_default`).default;
    return scenario;
  }

  private _registerRouteController(method: string, routePathArray: string[], controllerPath: string ): void {
    const absoluteControllerPath = `${this._mockHome}/data/${controllerPath}`;
    const wrappedController = async (ctx, next) => {
      let scenario = this._scenarioMap[controllerPath];
      if (!scenario) {
        scenario = this._getDefaultScenario(controllerPath);
        this._scenarioMap[controllerPath] = scenario;
      }
      const controller = require(`${absoluteControllerPath}/${scenario}`).default;
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
      this._router[method.toLowerCase()](routePath, wrappedController);
    });

  }

  private async _handleControllerSetting(controllerSetting: ControllerSetting, ctx) {
    if (controllerSetting.delay) {
      await sleep(controllerSetting.delay);
    }
    ctx.status = controllerSetting.status || DEFAULT_SUCCESS_STATUS;
    ctx.body = controllerSetting.data;
  }

  private async _useProxy(proxySetting: ProxySetting, ctx, next) {
    const toPath = pathToRegexp.compile(proxySetting.path);
    const targetPath = toPath(ctx.params);
    // TODO: add support for `multipart`
    try {
      const protocal = proxySetting.protocal || 'http';
      const portInfo = proxySetting.port ? `:${proxySetting.port}` : '';
      console.log(`${protocal}://${proxySetting.host}${portInfo}${targetPath}`);
      const result = await rp({
        url: `${protocal}://${proxySetting.host}${portInfo}${targetPath}`,
        method: ctx.request.method,
        headers: {
          ...ctx.request.headers,
          host: proxySetting.host
        },
        qs: ctx.request.query,
        body: ctx.request.body.toString(),
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
    console.log('[POST]: /_api/use-scenario');
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
  }

  private _enableCORS(): void {
    this._app.use(cors());
  }
}





