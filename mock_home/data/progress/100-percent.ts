async function resolver(ctx) {
  const result = Promise.resolve({
    data: {
      percent: 100
    }
  });
  return result;
}

export default resolver;