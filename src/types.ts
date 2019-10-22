import { Schema } from 'jsonschema';

export enum HTTP_METHOD {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export interface Route {
  path: string | string[];
  methods: HTTP_METHOD[];
  controller: string;
}

export interface ProxySetting {
  proxy: boolean;
  host: string;
  protocal?: string;
  port?: string;
  path: string;
}

export interface HttpsOptions {
  key: string;
  cert: string;
}

export interface MockServerConfig {
  host?: string;
  port?: string;
  https?: boolean;
  httpsOptions?: HttpsOptions;
}

export interface GlobalConfig {
  port?: string;
  delay?: number | {
    min: number;
    max: number;
  };
  uploadFolder?: string;
  proxyHeaderBlackList?: string[];
}

export type ScenarioSetting = string | string[];

export interface UseScenarioSetting {
  api: string;
  scenario: ScenarioSetting;
}

export type ValidatorRuleBodyType = 'json' | 'form' | 'text';

export interface ValidatorRule {
  headers: {
    [key: string]: string;
  };
  body: {
    type: 'json';
    schema: {
      [key: string]: Schema
    };
    refs?: Schema[];
  } | {
    type: 'form';
    schema: {
      [key: string]: Schema
    };
    refs?: Schema[];
  } | {
    type: 'text';
    pattern?: RegExp | string;
  }
}

export interface Validator {
  rule: ValidatorRule;
  status?: number;
}

export interface ControllerSetting {
  data: any;
  status?: number;
  delay?: number;
  useScenario?: UseScenarioSetting[];
  validators?: Validator[];
}

export interface PresetSetting {
  [key: string]: ScenarioSetting;
}