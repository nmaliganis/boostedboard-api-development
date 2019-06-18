'use strict'

const compose = require('koa-compose')
const boardService = require('../../services/board-service')
const summaryService = require('../../services/summary-service')
const { validatePathParameters } = require('../../middleware/validation')
const idInPathSchema = require('../../validation/schema/idParamInPath')

module.exports = {
  count: async ctx => {
    ctx.body = { count: await boardService.countAll() }
  },

  summary: async ctx => {
    ctx.body = await summaryService.boardSummary()
  },

  remove: compose([
    validatePathParameters(idInPathSchema),
    async ctx => {
      const boardId = ctx.request.validatedParams.id
      const boards = await boardService.removeNotOwn(boardId)

      ctx.status = 200
      ctx.body = { boards }
    },
  ]),
}
