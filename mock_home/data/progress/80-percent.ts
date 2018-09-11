async function resolver(ctx, next, server) {
  const result = Promise.resolve({
    data: {
      percent: 80
    },
    useScenario: [{
      api: 'progress',
      scenario: ['90-percent', '100-percent']
    }]
  });
  return result;
}

export default resolver;