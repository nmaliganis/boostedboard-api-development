'use strict'

const compose = require('koa-compose')
const { validateBody, validatePathParameters } = require('../../middleware/validation')
const cityService = require('../../services/city-service')
const citySubscriptionService = require('../../services/city-subscription-service')
const citySchema = require('../../validation/schema/admin/city')
const idInPathSchema = require('../../validation/schema/idParamInPath')

module.exports = {
  create: compose([
    validateBody(citySchema.create),
    async ctx => {
      const body = ctx.request.validatedBody
      const cities = await cityService.register(body)

      ctx.status = 201
      ctx.body = { cities }
    },
  ]),

  get: compose([
    validatePathParameters(idInPathSchema),
    async ctx => {
      const cityId = ctx.request.validatedParams.id

      const requestedCity = await cityService.getById(cityId)

      ctx.status = 200
      ctx.body = requestedCity
    },
  ]),

  remove: compose([
    validatePathParameters(idInPathSchema),
    async ctx => {
      const cityId = ctx.request.validatedParams.id

      const cities = await cityService.remove(cityId)

      ctx.status = 200
      ctx.body = { cities }
    },
  ]),

  getAll: async ctx => {
    const cities = await cityService.getAll(true)

    ctx.status = 200
    ctx.body = { cities }
  },

  update: compose([
    validatePathParameters(idInPathSchema),
    validateBody(citySchema.update),
    async ctx => {
      const cityId = ctx.request.validatedParams.id
      const body = ctx.request.validatedBody
      const updatedCity = await cityService.update(cityId, body)

      ctx.status = 200
      ctx.body = updatedCity
    },
  ]),

  summary: async ctx => {
    const summary = await citySubscriptionService.getSubscriptionSummaries()

    ctx.status = 200
    ctx.body = { summary }
  },
}
