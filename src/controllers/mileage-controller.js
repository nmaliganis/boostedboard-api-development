'use strict'

const compose = require('koa-compose')
const { validateBody } = require('../middleware/validation')
const mileageSchema = require('../validation/schema/mileage')
const mileageService = require('../services/mileage-service')

module.exports = {
  register: compose([
    validateBody(mileageSchema.register),
    async ctx => {
      await mileageService.register(ctx.request.validatedBody)
      ctx.status = 204
    },
  ]),
}
