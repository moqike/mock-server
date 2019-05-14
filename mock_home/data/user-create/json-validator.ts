export default {
  data: {
    name: 'Peter Pan',
    address: '101 Bluestreet, NewYork'
  },
  validators: [{
    rule: {
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': /.+/,
        'x-extra-info': 'key-abc'
      },
      body: {
        type: 'json',
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            address: {
              '$ref': '/Address'
            }
          }
        },
        refs: [{
          'id': '/Address',
          'type': 'object',
          'properties': {
            'street': {
              'type': 'string'
            },
            'city': {
              'type': 'string'
            }
          }
        }]
      }
    },
    status: 400
  }]
};