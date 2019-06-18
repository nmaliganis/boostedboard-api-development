'use strict'

const compose = require('koa-compose')
const middleware = require('../middleware')
const schema = require('../validation/schema')
const boardService = require('../services/board-service')
const { validatePathParameters } = require('../middleware/validation')
const idInPathSchema = require('../validation/schema/idParamInPath')

module.exports = {
  register: compose([
    middleware.validation.validateBody(schema.boards.register),
    async ctx => {
      const body = ctx.request.validatedBody
      const boards = await boardService.register(ctx.request.user.id, body)

      ctx.status = 201
      ctx.body = { boards }
    },
  ]),

  remove: compose([
    validatePathParameters(idInPathSchema),
    async ctx => {
      const boardId = ctx.request.validatedParams.id
      const boards = await boardService.remove(ctx.request.user, boardId)

      ctx.status = 200
      ctx.body = { boards }
    },
  ]),

  update: compose([
    validatePathParameters(idInPathSchema),
    middleware.validation.validateBody(schema.boards.update),
    async ctx => {
      const boardId = ctx.request.validatedParams.id
      const body = ctx.request.validatedBody
      const newBoard = await boardService.update(ctx.request.user.id, boardId, body)

      ctx.status = 200
      ctx.body = newBoard
    },
  ]),
}
