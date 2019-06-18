'use strict'

const compose = require('koa-compose')
const middleware = require('../middleware')
const schema = require('../validation/schema')
const cityService = require('../services/city-service')
const citySubscriptionService = require('../services/city-subscription-service')
const { validatePathParameters } = require('../middleware/validation')
const idInPathSchema = require('../validation/schema/idParamInPath')

module.exports = {
  getAll: compose([
    middleware.validation.validateQuery(schema.city.locationForSorting),
    async ctx => {
      const userId = ctx.request.user.id
      const isAdmin = ctx.request.user.isAdmin()

      const long = ctx.request.validatedQuery.long
      const lat = ctx.request.validatedQuery.lat

      const coordinates = lat && long ? [lat, long] : null

      const cities = await cityService.getPossibleCitiesToSubscribe(userId, isAdmin, coordinates)

      ctx.status = 200
      ctx.body = { cities }
    },
  ]),

  currentLocation: compose([
    middleware.validation.validateQuery(schema.city.currentLocation),
    async ctx => {
      const long = ctx.request.validatedQuery.long
      const lat = ctx.request.validatedQuery.lat
      const currentLocation = await cityService.cityQuery(long, lat)
      ctx.status = 200
      ctx.body = { currentLocation }
    },
  ]),

  subscribedCities: async ctx => {
    const userId = ctx.request.user.id

    const subscribedCities = await citySubscriptionService.getSubscribedCities(userId)

    ctx.status = 200
    ctx.body = { subscribedCities }
  },

  registerSubscription: compose([
    middleware.validation.validateBody(schema.city.subscribe),
    async ctx => {
      const userId = ctx.request.user.id
      const cityId = ctx.request.validatedBody.cityId

      const subscribedCities = await citySubscriptionService.subscribeUserToCityEvents(userId, cityId)

      ctx.status = 201
      ctx.body = { subscribedCities }
    },
  ]),

  unsubscribe: compose([
    validatePathParameters(idInPathSchema),
    async ctx => {
      const userId = ctx.request.user.id
      const cityId = ctx.request.validatedParams.id

      const subscribedCities = await citySubscriptionService.unsubscribeUserFromCityEvents(userId, cityId)

      ctx.status = 200
      ctx.body = { subscribedCities }
    },
  ]),
}
