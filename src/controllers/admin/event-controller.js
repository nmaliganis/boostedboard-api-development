'use strict'

const compose = require('koa-compose')
const { validateBody, validatePathParameters } = require('../../middleware/validation')
const eventService = require('../../services/event-service')
const eventSchema = require('../../validation/schema/admin/event')
const idInPathSchema = require('../../validation/schema/idParamInPath')

module.exports = {
  getAll: async ctx => {
    const events = await eventService.getAll()

    ctx.status = 200
    ctx.body = { events }
  },

  create: compose([
    validateBody(eventSchema.create),
    async ctx => {
      const body = ctx.request.validatedBody

      const events = await eventService.register(body)

      ctx.status = 201
      ctx.body = { events }
    },
  ]),

  update: compose([
    validateBody(eventSchema.update),
    validatePathParameters(idInPathSchema),
    async ctx => {
      const eventId = ctx.request.validatedParams.id
      const body = ctx.request.validatedBody
      const updatedEvent = await eventService.update(eventId, body)

      ctx.status = 200
      ctx.body = updatedEvent
    },
  ]),

  get: compose([
    validatePathParameters(idInPathSchema),
    async ctx => {
      const eventId = ctx.request.validatedParams.id

      const requestedEvent = await eventService.getById(eventId)

      ctx.status = 200
      ctx.body = requestedEvent
    },
  ]),

  remove: compose([
    validatePathParameters(idInPathSchema),
    async ctx => {
      const eventId = ctx.request.validatedParams.id

      const events = await eventService.remove(eventId)

      ctx.status = 200
      ctx.body = { events }
    },
  ]),
}
