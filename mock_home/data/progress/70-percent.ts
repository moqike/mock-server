async function resolver(ctx, next, server) {
  const result = Promise.resolve({
    data: {
      percent: 70
    }
  });
  server.useScenario('progress', '100-percent');
  return result;
}

export default resolver;