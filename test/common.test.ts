import assert from 'assert';
import 'mocha';
import request from 'supertest';
import { MockServer } from '../src/index';
import { MOCK_HOME, cleanup } from './util';

describe('common tests', function() {
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

  it('should return 200 with user list', async function() {
    const server = mockServer.listen();
    const res = await request(server).get('/user');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, [{
      name: 'Peter Pan',
      address: '101 Bluestreet, NewYork'
    }, {
      name: 'Peter Pan',
      address: '101 Bluestreet, NewYork'
    }]);
  });

  it('should return 200 with user detail', async function() {
    const server = mockServer.listen();
    const res = await request(server).get('/user/1');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { name: 'Peter Pan', address: '101 Bluestreet, NewYork' });
  });

  it('should return 200 with new created user', async function() {
    const server = mockServer.listen();
    let res = await request(server).post('/user')
      .send({
        name: 'Peter Pan',
        address: '101 Bluestreet, NewYork'
      });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { name: 'Peter Pan', address: '101 Bluestreet, NewYork' });
    res = await request(server).post('/user-create')
      .send({
        name: 'Peter Pan',
        address: '101 Bluestreet, NewYork'
      });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { name: 'Peter Pan', address: '101 Bluestreet, NewYork' });
  });

  it('should return 404 for /user/100', async function() {
    const server = mockServer.listen();
    const res = await request(server).get('/user/100');
    assert.equal(res.status, 404);
  });

  it('should return 404 error for /user', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
      .send({
        api: 'user-list',
        scenario: 'fail'
      });
    const res = await request(server).get('/user');
    assert.equal(res.status, 404);
  });

  it('should return 200 with car detail', async function() {
    const server = mockServer.listen();
    const res = await request(server).get('/car');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      brand: 'auto'
    });
  });

  it('should return 200 with car detail after 1000ms', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'car',
      scenario: 'delay'
    });
    const start = Date.now();
    const res = await request(server).get('/car');
    const usedTime = Date.now() - start;
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      brand: 'auto'
    });
    assert(usedTime >= 1000);
  });

  it('should return 200 with car detail after 100ms', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'car',
      scenario: 'success'
    });
    const start = Date.now();
    const res = await request(server).get('/car');
    const usedTime = Date.now() - start;
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      brand: 'auto'
    });
    assert(usedTime >= 100);
  });

  it('should return 200 with car detail after 150ms ~ 200ms', async function() {
    const min = 150;
    const max = 200;
    mockServer._globalConfig.delay = {
      min,
      max
    };
    const server = mockServer.listen();
    await request(server).post('/_api/use-scenario')
    .send({
      api: 'car',
      scenario: 'success'
    });
    const start = Date.now();
    const res = await request(server).get('/car');
    const usedTime = Date.now() - start;
    console.log(usedTime);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      brand: 'auto'
    });
    assert(usedTime >= min);
    assert(usedTime < max + 5);
  });

  it('should load preset', async function() {
    const server = mockServer.listen();
    await request(server).post('/_api/load-preset')
    .send({
      preset: 'demo'
    });
    let res = await request(server).get('/user/1');
    assert.equal(res.status, 404);
    res = await request(server).get('/user/1');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { name: 'Peter Pan', address: '101 Bluestreet, NewYork' });
  });

  it('should change progress response after first request', async function() {
    const server = mockServer.listen();
    let res = await request(server).get('/progress');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      percent: 70
    });
    res = await request(server).get('/progress');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      percent: 80
    });
    res = await request(server).get('/progress');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      percent: 90
    });
    res = await request(server).get('/progress');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      percent: 100
    });
    // check the status again as the scenario array should contain
    // only one element now.
    res = await request(server).get('/progress');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      percent: 100
    });
  });
});