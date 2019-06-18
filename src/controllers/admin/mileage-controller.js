'use strict'

const compose = require('koa-compose')
const { validateQuery } = require('../../middleware/validation')
const summaryService = require('../../services/summary-service')
const mileageService = require('../../services/mileage-service')
const mileageSchema = require('../../validation/schema/admin/mileage')
const { kilometersToRoundedMiles } = require('../../utils')

module.exports = {
  sum: compose([
    validateQuery(mileageSchema.sum),
    async ctx => {
      const from = ctx.request.validatedQuery.from
      const to = ctx.request.validatedQuery.to

      const sum = from && to
        ? await mileageService.sum({ from, to })
        : await mileageService.sumAll()

      ctx.body = { sum: kilometersToRoundedMiles(sum) }
    },
  ]),

  summary: async ctx => {
    ctx.body = await summaryService.mileageSummary()
  },
}
