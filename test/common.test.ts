import assert from 'assert';
import 'mocha';
import request from 'supertest';
import path from 'path';
import { MockServer } from '../src/index';

describe('all tests', function() {
  let mockServer;
  before(function() {
    mockServer = new MockServer({
      mockHome: path.resolve(__dirname, '../mock_home')
    });
  });

  afterEach(function () {
    mockServer.close();
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
    const res = await request(server).get('/car');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      brand: 'auto'
    });
  });
});