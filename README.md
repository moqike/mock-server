Just a simple mock server!

<a href="http://travis-ci.com/moqike/mock-server"><img src="https://api.travis-ci.com/moqike/mock-server.svg?branch=master" alt="Build Status"></a>

## Install

```sh
npm i --save mqk-mock-server
```

## Set up mock_home

Create a folder as `mock_home`. `mock_home` folder should be in following structure:
```
mock_home
|
|--data
|  |
|  |--[api-controller-folder-name]
|     |
|     |--_default.js | _default.ts
|     |--[api-scenario-file-name]
|
|--preset
|     |
|     |--[preset-file-name]
|
|--routing
|     |
|     |--[route-file-name]
|
|--msconfig.json

```

### (Optional) Use mqk cli to create mock server

For mqk cli usage see [mqk-cli](fhttps://github.com/moqike/mqk-cli)

```sh
# install cli tool
npm i -g mqk-cli
# install mock server template
npm i -g mqk-template-mock-server@latest
# create mock server instance
mqk g
# select mock-server
# created!
```

## Route file

A route file should export an array of `Route` settings.

```ts
interface Route {
  path: string | string[];
  methods: HTTP_METHOD[];
  controller: string;
}
```

For example

```ts
export default [{
  path: '/user',
  methods: ['GET'],
  controller: 'user-list',
}, {
  path: '/user/:id',
  methods: ['GET'],
  controller: 'user',
}, {
  path: ['/user', '/user-create'],
  methods: ['POST'],
  controller: 'user-create'
}];
```

## Default Scenario Setting
Make sure there is a [`_default.js | _default.ts]` file under each `[api-controller-folder-name]` folder. It simply export the default scenario name/names of `API Scenario File`.

For example

```ts
export default 'success';
```

If an array of scenarios is used, mock server will respond with senario data in sequence.

```ts
export default ['success', 'failed'];
```

## API Scenario File

An `API Scenario File` should return meta data for an API (regard as `API Setting`). `API Scenario File` can be in one of following format:

### Plain Object (Declarative)

Export `API Setting` in plain object directly.

```ts
export default {
  delay: 1000,
  data: {
    brand: 'auto'
  }
};
```

### Async function (Programmatic)

Export an async function that returns a Promise which resolves / rejects with `API Setting`.

For example

```ts
async function resolver(ctx: RouterContext) {
  let result = await Promise.resolve({
    delay: 1000,
    data: {
      name: 'Peter Pan',
      address: '101 Bluestreet, NewYork'
    }
  });

  if (ctx.params.id) {
    const id = parseInt(ctx.params.id, 10);
    if (id > 5) {
      result = await Promise.reject({
        status: 404,
        data: {
          message: 'not found'
        }
      });
    }
  }
  return result;
}

export default resolver;
```

## API Setting

`API Setting` support following features.

### Response data, status, delay,

```ts
export default {
  delay: 1000,
  data: {
    brand: 'auto'
  },
  status: 200 // 200 by default
};
```

### Proxy to remote API endpoint

```ts
export default {
  proxy: true,
  host: 'localhost',
  protocal: 'http',
  port: '3001',
  path: '/fake-user-service/:id'
};
```

### Set scenario for related APIs
Declarative

```ts
export default {
  delay: 1000,
  useScenario: [{
    api: 'progress',
    scenario: ['90-percent', '100-percent']
  }]
};
```

Programmatic

```ts
async function resolver(ctx, next, server) {
  const result = await Promise.resolve({
    data: {
      percent: 70
    }
  });
  server.useScenario('progress', '80-percent');
  return result;
}
```

### Validate request headers and data

```ts
export default {
  data: {
    name: 'Peter Pan',
    address: '101 Bluestreet, NewYork'
  },
  validators: [{
    rule: {
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': /.+/,
        'x-extra-info': 'key-abc'
      },
      body: {
        type: 'json',
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            address: {
              '$ref': '/Address'
            }
          },
          required: ['name']
        },
        refs: [{
          'id': '/Address',
          'type': 'object',
          'properties': {
            'street': {
              'type': 'string'
            },
            'city': {
              'type': 'string'
            }
          }
        }]
      }
    },
    status: 400
  }]
};
```

#### Validate http header

`rule.headers[key]` can be `string` or `RegExp`

#### Validate http body

`rule.body.type` can be one of `json`, `form`, `text`

For `json`, following options are available:
- `rule.body.schema`: `JSON schema`
- `rule.body.refs`: `JSON schema definitoin` to be referenced in schema

For `form`, following options are available:
- `rule.body.schema`: JSON schema

For `text`, following options are available:
- `rule.body.pattern`: `string` or `RegExp`

## Globa configuration file

The global configuration file `msconfig.json` can be provided under `mock_home` folder. Global configurations are overridden by API specific configurations.
Following is an example configuration file:
```json
{
  "delay": 100 // or range {"min": 100, "max": 150}
}
```

## Start The Mock Server

Export your `mock_home` path as `process.env.MOCK_HOME` or pass it to the constructor of mock server.

For example

```ts
import { MockServer } from 'mqk-mock-server';
mockServer = new MockServer({
  mockHome: path.resolve(__dirname, '../mock_home')
});
// Listen certain port
mockServer.listen(3000);
```

Enable HTTPS

```ts
import { MockServer } from 'mqk-mock-server';
mockServer = new MockServer({
  mockHome: path.resolve(__dirname, '../mock_home'),
  https: true,
  httpsOptions: {
    key: fs.readFileSync('path to key file'), 'utf8'),
    cert: fs.readFileSync('path to cert file'), 'utf8')
  }
});
// Listen certain port
mockServer.listen(9443);
```

## Stop The Mock Server
```ts
mockServer.close();
```

## CLI
### install

```sh
npm i -g mqk-mock-server
```

### Start mock server

`cd` to `MOCK_HOME`. Make sure files under MOCK_HOME is compiled otherwise you should use the programmatic way, see [Start The Mock Server](Start The Mock Server)

```sh
ms start
```

### Change API scenario
`cd` to `MOCK_HOME`.

```sh
ms use <api> <scenario>

# or use cmd alias

ms u <api> <scenario>

# or use the default scenario

ms u <api>
```

### Show current API scenario
`cd` to `MOCK_HOME`.

```sh
ms state <api>

# or use cmd alias

ms c <api>
```

### Load API scenario preset
`cd` to `MOCK_HOME`.

```sh
ms load <preset>

# or use cmd alias

ms l <preset>
```

### Save all used API scenarios and loaded API scenario presets as local preset file
`cd` to `MOCK_HOME`.

```sh
ms save <preset>

# or use cmd alias

ms p <preset>
```

## Public API

HTTP API used to control the mock server

### Change API scenario

Change scenario for certain api dynamically.

`_api/use-scenario`

Method:

`POST`

Params:

- api: string (the name of controller)
- scenario: string (the name of scenario)


## Change log
- v1.2.4
  - `ms save` command
  - auto save changed scenarios to `preset/.tmp.ts` preset file
- v1.2.3 fix proxy body param
- v1.2
  - Request validator
- v1.1
  - Global delay configuration (support `max`, `min` settings).
  - Fix form-data/multipart file upload
- v1.0 initial release
