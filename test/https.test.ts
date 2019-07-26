import assert from 'assert';
import 'mocha';
import request from 'supertest';
import path from 'path';
import fs from 'fs';

import { MockServer } from '../src/index';
import { MOCK_HOME, cleanup } from './util';

// Supress self signed cert error
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('test with https protocal', function() {
  let mockServer;

  afterEach(function () {
    mockServer.close();
    cleanup();
  });

  before(function() {
    mockServer = new MockServer({
      mockHome: MOCK_HOME,
      https: true,
      httpsOptions: {
        key: fs.readFileSync(path.resolve(__dirname, './ssl/key.pem'), 'utf8'),
        cert: fs.readFileSync(path.resolve(__dirname, './ssl/certificate.pem'), 'utf8')
      }
    });
  });

  it('should return 200 with user details from https server', async function() {
    const server = mockServer.listen();
    const res = await request(server).get('/user/1');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { name: 'Peter Pan', address: '101 Bluestreet, NewYork' });
  });
});