'use strict'

const ApiError = require('./apiError')

module.exports = class ForbiddenError extends ApiError {
  constructor(message = 'The user is not allowed to access this resource.') {
    super('E_FORBIDDEN', message, 403, 'warn')
  }
}
