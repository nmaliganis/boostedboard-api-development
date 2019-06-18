'use strict'

const crypto = require('crypto')
const log = require('../common/logger')
const config = require('../config')
const errors = require('../common/errors')

module.exports = {

  /**
   * Global error handler which formats thrown errors to client friendly JSON
   * @param {Object} ctx Koa context
   * @param {Function} middleware Reference to the next middleware
   * @returns {void}
   */
  async handleErrors(ctx, middleware) {
    try {
      await middleware()

      log.info({ request: ctx.request, response: ctx.response }, 'http request/response successful')
    } catch (err) {
      // Generate unique id for every error so that we can track it quickly
      err.correlationId = crypto.randomBytes(4).toString('hex')

      if (err instanceof errors.ApiError) {
        // Known error, we threw it
        respondKnownError(ctx, err)
      } else {
        // Unknown error
        respondUnknownError(ctx, err)
      }

      if (err.level === 'warn') {
        log.warn({ err, request: ctx.request, response: ctx.response }, 'http request/response error')
      } else {
        log.error({ err, request: ctx.request, response: ctx.response }, 'http request/response error')
      }
    }
  },
}

function respondKnownError(ctx, err) {
  ctx.status = err.status || 500
  ctx.body = {
    correlationId: err.correlationId,
    name: err.name,
    type: err.type,
    message: err.message,
    errorCode: err.errorCode,
  }
  ctx.body.stack = config.env === 'production' ? null : err.stack
}

function respondUnknownError(ctx, err) {
  ctx.status = 500

  // Do not leak info in production environment
  if (config.env === 'production') {
    ctx.body = {
      correlationId: err.correlationId,
      name: err.name,
      message: 'Unknown error occurred.',
    }
    return
  }

  // Not production environment, include error info
  ctx.body = {
    correlationId: err.correlationId,
    name: err.name,
    message: err.message,
    stack: err.stack,
  }
}
