async function resolver(ctx) {
    return Promise.resolve({
      data: {
        name: ctx.request.body.name,
        address: ctx.request.body.address
      }
    });
  }

  export default resolver;