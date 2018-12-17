async function resolver(ctx, next, server) {
  const result = await Promise.resolve({
    data: {
      percent: 90
    }
  });
  return result;
}

export default resolver;