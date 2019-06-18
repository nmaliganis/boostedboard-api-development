'use strict'

const Router = require('koa-router')
const policies = require('../policies')
const controllers = require('../controllers')

const router = new Router()

router.use(policies.authenticated)

// Auth
router.post('/auth/logout', controllers.auth.logout)

// Users
router.get('/users/me', controllers.user.getMe)
router.patch('/users/me', controllers.user.updateMe)
router.post('/users/push-token', controllers.user.updateToken)

// Boards
router.post('/boards', controllers.board.register)
router.delete('/boards/:id', controllers.board.remove)
router.patch('/boards/:id', controllers.board.update)

// Rides
router.post('/rides', controllers.ride.create)
router.delete('/rides/:rideId', controllers.ride.remove)
router.post('/rides/:rideId/shared', controllers.ride.markAsShared)
router.get('/users/me/rides', controllers.ride.getMine)

// Spots
router.post('/spots', controllers.spot.create)
router.delete('/spots/:spotId', controllers.spot.remove)

// Cities
router.get('/cities', controllers.city.getAll)
router.get('/cities/location', controllers.city.currentLocation)
router.get('/cities/subscriptions', controllers.city.subscribedCities)
router.post('/cities/subscriptions', controllers.city.registerSubscription)
router.delete('/cities/subscriptions/:id', controllers.city.unsubscribe)

// Events
router.get('/events/', controllers.event.getAll)
router.post('/events/registrations', controllers.event.register)
router.get('/events/:id', controllers.event.get)

// Inbox
router.get('/inbox/', controllers.inbox.getAll)
router.post('/inbox/message-interaction', controllers.inbox.messageInteract)

// AWS
router.post('/aws/signed-url', controllers.aws.signedUrl)

const routes = router.routes()

module.exports = routes
