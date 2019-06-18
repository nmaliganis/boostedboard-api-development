'use strict'

const joi = require('joi')
const _ = require('lodash')
const log = require('../common/logger')
const errors = require('../common/errors')

module.exports = {

  /**
   * Validates request body and fills request
   * @param {Object} schema Joi validation schema used for body validation
   * @returns {function}
   */
  validateBody(schema) {
    return async (ctx, middleware) => {
      const validationResult = joi.validate(ctx.request.body, schema)
      if (validationResult.error) {
        log.warn(validationResult.error, 'Request validation error.')
        throw new errors.ValidationError(_.get(validationResult.error, 'details[0].message', 'Unknown validation error.'))
      }

      ctx.request.validatedBody = validationResult.value

      await middleware()
    }
  },

  validateQuery(schema) {
    return async (ctx, middleware) => {
      const validationResult = joi.validate(ctx.query, schema)
      if (validationResult.error) {
        log.warn(validationResult.error, 'Request query validation error.')
        throw new errors.ValidationError(_.get(validationResult.error, 'details[0].message', 'Unknown validation error.'))
      }

      ctx.request.validatedQuery = validationResult.value

      await middleware()
    }
  },

  validatePathParameters(schema) {
    return async (ctx, middleware) => {
      const validationResult = joi.validate(ctx.params, schema)
      if (validationResult.error) {
        log.warn(validationResult.error, 'Request path parameters validation error.')
        throw new errors.ValidationError(_.get(validationResult.error, 'details[0].message', 'Unknown validation error.'))
      }

      ctx.request.validatedParams = validationResult.value

      await middleware()
    }
  },
}
