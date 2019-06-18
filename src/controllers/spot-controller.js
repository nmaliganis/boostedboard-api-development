'use strict'

const compose = require('koa-compose')
const middleware = require('../middleware')
const schema = require('../validation/schema')
const spotService = require('../services/spot-service')
const { validatePathParameters } = require('../middleware/validation')

module.exports = {
  create: compose([
    middleware.validation.validateBody(schema.spots.create),
    async ctx => {
      const body = ctx.request.validatedBody
      const spot = await spotService.create(ctx.request.user.id, body)

      ctx.status = 201
      ctx.body = spot
    },
  ]),

  get: compose([
    validatePathParameters(schema.spots.spotIdInPath),
    async ctx => {
      const spot = await spotService.get(ctx.params.spotId)

      ctx.status = 200
      ctx.body = spot
    },
  ]),

  getInRadius: compose([
    middleware.validation.validateQuery(schema.spots.getInRadius),
    async ctx => {
      const query = ctx.request.validatedQuery
      const spots = await spotService.getInRadius(query.lat, query.lng, query.radius, query.type)

      ctx.status = 200
      ctx.body = spots
    },
  ]),

  remove: compose([
    validatePathParameters(schema.spots.spotIdInPath),
    async ctx => {
      await spotService.remove(ctx.request.user.id, ctx.params.spotId)

      ctx.status = 204
    },
  ]),
}
