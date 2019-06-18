'use strict'

const compose = require('koa-compose')
const { validateQuery, validatePathParameters } = require('../../middleware/validation')
const userSchema = require('../../validation/schema/admin/users')
const idInPathSchema = require('../../validation/schema/idParamInPath')
const userService = require('../../services/user-service')
const summaryService = require('../../services/summary-service')

module.exports = {
  index: compose([
    validateQuery(userSchema.index),
    async ctx => {
      const limit = ctx.request.validatedQuery.limit
      const offset = ctx.request.validatedQuery.offset

      const orderColumn = ctx.request.validatedQuery.orderColumn
      const orderDirection = ctx.request.validatedQuery.orderDirection

      const searchColumn = ctx.request.validatedQuery.searchColumn
      const searchQuery = ctx.request.validatedQuery.searchQuery

      ctx.body = {
        totalCount: await userService.countAll({ searchColumn, searchQuery }),
        items: await userService.findAll({
          offset,
          limit,
          orderColumn,
          orderDirection,
          searchColumn,
          searchQuery,
        }),
      }
    },
  ]),

  count: compose([
    validateQuery(userSchema.count),
    async ctx => {
      const from = ctx.request.validatedQuery.from
      const to = ctx.request.validatedQuery.to

      ctx.body = { count: await userService.count({ from, to }) }
    },
  ]),

  summary: async ctx => {
    ctx.body = await summaryService.userSummary()
  },

  remove: compose([
    validatePathParameters(idInPathSchema),
    async ctx => {
      const userId = ctx.request.validatedParams.id
      await userService.remove(userId)

      ctx.status = 204
    },
  ]),
}
