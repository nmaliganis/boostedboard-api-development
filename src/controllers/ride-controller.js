'use strict'

const compose = require('koa-compose')
const middleware = require('../middleware')
const { validateQuery, validatePathParameters } = require('../middleware/validation')
const schema = require('../validation/schema')
const rideService = require('../services/ride-service')

module.exports = {
  create: compose([
    middleware.validation.validateBody(schema.rides.create),
    async ctx => {
      const body = ctx.request.validatedBody
      const rides = await rideService.create(ctx.request.user.id, body)

      ctx.status = 201
      ctx.body = rides
    },
  ]),

  getMine: compose([
    validateQuery(schema.rides.getMine),
    async ctx => {
      const ridesAndStats = await rideService.getByUser(ctx.request.user.id, {
        limit: ctx.request.validatedQuery.limit,
        offset: ctx.request.validatedQuery.offset,
      })

      ctx.status = 200
      ctx.body = ridesAndStats
    },
  ]),

  markAsShared: compose([
    validatePathParameters(schema.rides.rideIdInPath),
    async ctx => {
      const filter = { id: ctx.request.validatedParams.rideId, userId: ctx.request.user.id }
      const dataToUpdate = { shared: true }

      const ride = await rideService.update(filter, dataToUpdate)

      ctx.status = 200
      ctx.body = ride
    },
  ]),

  remove: compose([
    validatePathParameters(schema.rides.rideIdInPath),
    async ctx => {
      await rideService.remove(ctx.request.user.id, ctx.request.validatedParams.rideId)

      ctx.status = 204
    },
  ]),
}
