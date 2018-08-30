import Koa from 'koa';
import Router from 'koa-router';

const router = new Router();
const app = new Koa();

router.get('/fake-user-service/:id', (ctx) => {
  ctx.body = {
    'id': ctx.params.id,
    'name': 'Data from proxy',
    'address': '101 Bluestreet, NewYork'
  };
  ctx.status = 200;
});

app.use(router.routes());

// app.listen(3001);

export default app;