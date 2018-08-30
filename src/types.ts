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

export interface ControllerSetting {
  data: any;
  status?: number;
  delay?: number;

}