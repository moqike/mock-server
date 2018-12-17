async function resolver(ctx) {
  let result = await Promise.resolve({
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