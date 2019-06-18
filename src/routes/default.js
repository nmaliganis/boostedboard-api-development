'use strict'

const Router = require('koa-router')
const controllers = require('../controllers')

const router = new Router()

// Auth
router.post('/auth/native', controllers.auth.native)
router.post('/auth/facebook', controllers.auth.facebook)
router.post('/auth/google', controllers.auth.google)
router.post('/auth/refresh', controllers.auth.refresh)

// Users
router.post('/users', controllers.user.register)
router.post('/users/verify-email', controllers.user.verifyEmail)
router.post('/users/request-password-reset', controllers.user.requestPasswordReset)
router.post('/users/confirm-password-reset', controllers.user.confirmPasswordReset)

// Mileage
router.post('/mileage', controllers.mileage.register)

// Spots
router.get('/spots/:spotId', controllers.spot.get)
router.get('/spots', controllers.spot.getInRadius)

const routes = router.routes()

module.exports = routes
