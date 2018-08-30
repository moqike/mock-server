export default [{
  path: '/user',
  methods: ['GET'],
  controller: 'user-list',
}, {
  path: '/user/:id',
  methods: ['GET'],
  controller: 'user',
}, {
  path: ['/user', '/user-create'],
  methods: ['POST'],
  controller: 'user-create'
}];