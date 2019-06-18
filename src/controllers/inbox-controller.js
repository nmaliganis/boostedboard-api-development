'use strict'

const compose = require('koa-compose')
const eventService = require('../services/event-service')
const middleware = require('../middleware')
const schema = require('../validation/schema')
const messageStateService = require('../services/message-state-service')
const boardService = require('../services/board-service')

module.exports = {
  getAll: async ctx => {
    const userId = ctx.request.user.id

    const marketingMessages = []
    const [events, boardsWithFWUpdate] = await Promise.all([
      eventService.upcomingEventsWithGoingStatus(userId),
      boardService.findByUserWithFWUpdate(userId),
    ])

    ctx.status = 200
    ctx.body = { events, marketingMessages, boardsWithFWUpdate }
  },

  messageInteract: compose([
    middleware.validation.validateBody(schema.messageInteraction),
    async ctx => {
      const userId = ctx.request.user.id
      const messageId = ctx.request.validatedBody.messageId
      const messageState = ctx.request.validatedBody.messageState

      await messageStateService.interactWithMessage(userId, messageId, messageState)

      const events = await eventService.upcomingEventsWithGoingStatus(userId)
      const marketingMessages = []

      ctx.status = 201
      ctx.body = { events, marketingMessages }
    },
  ]),
}
