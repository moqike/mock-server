export default {
  data: {
    name: 'Peter Pan',
    address: '101 Bluestreet, NewYork'
  },
  validators: [{
    rule: {
      headers: {
        'Content-Type': 'text/plain',
      },
      body: {
        type: 'text',
        pattern: /^\d+$/
      }
    },
    status: 400
  }]
};