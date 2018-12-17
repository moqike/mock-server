async function resolver(ctx, next, server) {
  const result = await Promise.resolve({
    data: {
      percent: 70
    }
  });
  server.useScenario('progress', '80-percent');
  return result;
}

export default resolver;