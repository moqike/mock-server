async function resolver(ctx, next, server) {
  const result = Promise.resolve({
    data: {
      percent: 90
    }
  });
  return result;
}

export default resolver;