import assert from 'assert';
import 'mocha';
import request from 'supertest';
import path from 'path';
import { MockServer } from '../src/index';
import { MOCK_HOME, cleanup } from './util';

describe('test validator feature', function() {
  let mockServer;
  before(function() {
    mockServer = new MockServer({
      mockHome: MOCK_HOME
    });
  });

  afterEach(function () {
    mockServer.close();
    cleanup();
  });

  it('should return 400 due to missing csrf token', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'user-create',
      scenario: 'json-validator'
    });
    let res = await request(server).post('/user')
      .send({
        name: 'Peter Pan',
        address: {
          street: '101 Bluestreet',
          city: 'NewYork'
        }
      });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, {});
  });

  it('should return 400 due to wrong request body', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'user-create',
      scenario: 'json-validator'
    });
    let res = await request(server).post('/user')
      .set({
        'x-csrf-token': 'abcdefg',
        'x-extra-info': 'key-abc'
      })
      .send({
        name: 123,
        address: {
          street: '101 Bluestreet',
          city: 'NewYork'
        }
      });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, {});
  });

  it('should return 200 with correct data', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'user-create',
      scenario: 'json-validator'
    });
    let res = await request(server).post('/user')
      .set({
        'x-csrf-token': 'abcdefg',
        'x-extra-info': 'key-abc'
      })
      .send({
        name: 'Peter Pan',
        address: {
          street: '101 Bluestreet',
          city: 'NewYork'
        }
      });
    assert.deepEqual(res.body, { name: 'Peter Pan', address: '101 Bluestreet, NewYork' });
  });

  it('should return 400 with incorrect form data', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'user-create',
      scenario: 'form-validator'
    });
    let res = await request(server).post('/user')
      .set({
        'content-type': 'application/x-www-form-urlencoded'
      })
      .send('name=123&address=NewYork');
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, {});
  });

  it('should return 200 with correct form data', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'user-create',
      scenario: 'form-validator'
    });
    let res = await request(server).post('/user')
      .set({
        'content-type': 'application/x-www-form-urlencoded'
      })
      .send('name=peter&address=NewYork');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { name: 'Peter Pan', address: '101 Bluestreet, NewYork' });
  });

  it('should return 400 with illegal text data', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'user-create',
      scenario: 'text-validator'
    });
    let res = await request(server).post('/user')
      .set({
        'content-type': 'text/plain'
      })
      .send('invalid request data');
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, {});
  });

  it('should return 200 with legal text data', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'user-create',
      scenario: 'text-validator'
    });
    let res = await request(server).post('/user')
      .set({
        'content-type': 'text/plain'
      })
      .send('1234');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { name: 'Peter Pan', address: '101 Bluestreet, NewYork' });
  });
});