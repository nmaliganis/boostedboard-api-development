'use strict'

const compose = require('koa-compose')
const middleware = require('../middleware')
const schema = require('../validation/schema')
const eventService = require('../services/event-service')
const eventRegistrationService = require('../services/event-registration-service')
const { validatePathParameters, validateQuery } = require('../middleware/validation')
const idInPathSchema = require('../validation/schema/idParamInPath')

module.exports = {
  getAll: async ctx => {
    const userId = ctx.request.user.id

    const events = await eventService.upcomingEventsWithGoingStatus(userId)

    ctx.status = 200
    ctx.body = { events }
  },

  register: compose([
    middleware.validation.validateBody(schema.eventRegistration.register),
    async ctx => {
      const userId = ctx.request.user.id
      const eventId = ctx.request.validatedBody.eventId
      const going = ctx.request.validatedBody.going

      await eventRegistrationService.register(userId, eventId, going)
      const registeredEvent = (await eventService.upcomingEventsWithGoingStatus(userId)).find(event => event.id === eventId)

      ctx.status = 201
      ctx.body = { registeredEvent }
    },
  ]),

  get: compose([
    validatePathParameters(idInPathSchema),
    validateQuery(schema.events.readEventFlag),
    async ctx => {
      const userId = ctx.request.user.id
      const eventId = ctx.request.validatedParams.id
      const changeToRead = ctx.request.validatedQuery.read

      const requestedEvent = await eventService.singleEventForUser(userId, eventId, changeToRead)

      ctx.status = 200
      ctx.body = requestedEvent
    },
  ]),
}
