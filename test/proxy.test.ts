import assert from 'assert';
import 'mocha';
import request from 'supertest';
import path from 'path';

import { MockServer } from '../src/index';
import fakeService from './server';
import { MOCK_HOME, cleanup } from './util';

describe('test with proxy', function() {
  let fakeServiceServer;
  let mockServer;

  afterEach(function () {
    mockServer.close();
  });

  before(function() {
    mockServer = new MockServer({
      mockHome: MOCK_HOME
    });
    fakeServiceServer = fakeService.listen(3001);
  });

  after(function () {
    fakeServiceServer.close();
    cleanup();
  });

  it('should return 200 with data from proxy', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
      .send({
        api: 'user',
        scenario: 'proxy'
      });
    const res = await request(server).get('/user/1');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { id: '1', name: 'Data from proxy', address: '101 Bluestreet, NewYork' });
  });

  it('should return error from proxy', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
      .send({
        api: 'user',
        scenario: 'proxy'
      });
    const res = await request(server).get('/user/1');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { id: '1', name: 'Data from proxy', address: '101 Bluestreet, NewYork' });
  });
});