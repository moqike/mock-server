async function resolver(ctx) {
  return await Promise.resolve({
    data: [{
      name: 'Peter Pan',
      address: '101 Bluestreet, NewYork'
    }, {
      name: 'Peter Pan',
      address: '101 Bluestreet, NewYork'
    }]
  });
}

export default resolver;