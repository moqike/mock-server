async function resolver(ctx) {
  const result = await Promise.resolve({
    data: {
      percent: 100
    }
  });
  return result;
}

export default resolver;