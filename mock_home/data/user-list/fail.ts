async function resolver(ctx) {
  return Promise.reject({
    status: 404,
    data: {
      message: 'not found'
    }
  });
}

export default resolver;