<a href="http://travis-ci.com/moqike/mock-server"><img src="https://api.travis-ci.com/moqike/mock-server.svg?branch=master" alt="Build Status"></a>

### Install
```sh
npm i --save mqk-mock-server
```

### Set up mock_home
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

#### (Optional) Use mqk cli to create mock server
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

#### Route file
A route file should export an array of `Route` settings

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

#### Api Scenario Controller File
A route file should be one of following:
- Export a function that returns a Promise which resolves / rejects with mock api response

For example
```ts
async function resolver(ctx) {
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

- Export data directly (a plain object)

For example

```ts
export default {
  delay: 1000,
  data: {
    brand: 'auto'
  }
};
```

- Export proxy setting (a plain object)

For example

```ts
export default {
  proxy: true,
  host: 'localhost',
  protocal: 'http',
  port: '3001',
  path: '/fake-user-service/:id'
};
```

- Set scenario for related APIs

For example

```ts
export default {
  delay: 1000,
  useScenario: [{
    api: 'progress',
    scenario: ['90-percent', '100-percent']
  }]
};
```

or in programmatic way

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

#### Default Scenario Setting
Make sure there is a `_default.[js, ts]` file under each `[api-controller-folder-name]` folder. It simply export the default scenario name/names.

For example

```ts
export default 'success';
```

an array of scenarios (mock api will send response with each scenario in order)

```ts
export default ['success', 'failed'];
```

#### Globa configuration file
The global configuration file `msconfig.json` can be provided under `mock_home` folder. Global configurations are overridden by API specific configurations.
Following is an example configuration file:
```json
{
  "delay": 100 // or range {"min": 100, "max": 150}
}
```

### Start The Mock Server
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

Enable https
```
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

### Stop The Mock Server
```ts
mockServer.close();
```

### CLI
#### install

```sh
npm i -g mqk-mock-server
```

#### Start mock server

`cd` to `MOCK_HOME`. Make sure files under MOCK_HOME is compiled otherwise you should use the programmatic way, see [Start The Mock Server](Start The Mock Server)
```
ms start
```

#### Change API scenario
`cd` to `MOCK_HOME`.
```
ms use <api> <scenario>

// or use cmd alias

ms u <api> <scenario>

// or use the default scenario

ms u <api>
```

#### Show current API scenario
`cd` to `MOCK_HOME`.
```
ms state <api>

// or use cmd alias

ms c <api>
```

#### Load API scenario preset
`cd` to `MOCK_HOME`.
```
ms load <preset>

// or use cmd alias

ms l <preset>
```

### Public API
#### Change API scenario
Use this http API to change scenario for certain api dynamically.

`_api/use-scenario`

method:

  `POST`

params:

  - api: string (the name of controller)
  - scenario: string (the name of scenario)
