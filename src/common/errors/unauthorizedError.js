'use strict'

const ApiError = require('./apiError')

module.exports = class UnauthorizedError extends ApiError {
  constructor(message = 'The user was not authorized.') {
    super('E_UNAUTHORIZED', message, 401, 'warn')
  }
}
