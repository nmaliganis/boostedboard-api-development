'use strict'

const Router = require('koa-router')
const controllers = require('../controllers/admin')
const policies = require('../policies')

const router = new Router({ prefix: '/admin' })

// auth
router.post('/auth/google', controllers.auth.google)

router.use(policies.admin)

// users
router.get('/users/count', controllers.user.count)
router.get('/users/summary', controllers.user.summary)
router.get('/users', controllers.user.index)
router.delete('/users/:id', controllers.user.remove)

// boards
router.get('/boards/count', controllers.board.count)
router.get('/boards/summary', controllers.board.summary)
router.delete('/boards/:id', controllers.board.remove)

// mileage
router.get('/mileage/sum', controllers.mileage.sum)
router.get('/mileage/summary', controllers.mileage.summary)

// Cities
router.post('/cities', controllers.city.create)
router.get('/cities/summary', controllers.city.summary)
router.patch('/cities/:id', controllers.city.update)
router.get('/cities/:id', controllers.city.get)
router.delete('/cities/:id', controllers.city.remove)
router.get('/cities', controllers.city.getAll)

// Events
router.get('/events', controllers.event.getAll)
router.post('/events', controllers.event.create)
router.patch('/events/:id', controllers.event.update)
router.get('/events/:id', controllers.event.get)
router.delete('/events/:id', controllers.event.remove)

module.exports = router.routes()
