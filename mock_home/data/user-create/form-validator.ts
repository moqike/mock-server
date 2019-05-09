export default {
  data: {
    name: 'Peter Pan',
    address: '101 Bluestreet, NewYork'
  },
  validators: [{
    rule: {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        type: 'form',
        schema: {
          name: {
            type: 'string',
            pattern: '^[a-zA-Z]+$'
          },
          address: {
            type: 'string'
          }
        }
      }
    },
    status: 400
  }]
};