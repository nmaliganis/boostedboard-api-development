'use strict'

const ApiError = require('./apiError')

module.exports = class InternalServerError extends ApiError {
  constructor(message = 'Unknown error.') {
    super('E_INTERNAL_SERVER_ERROR', message, 500)
  }
}
