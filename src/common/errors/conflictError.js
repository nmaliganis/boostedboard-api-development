'use strict'

const ApiError = require('./apiError')

module.exports = class ConflictError extends ApiError {
  constructor(message = 'Conflict record found.') {
    super('E_CONFLICT', message, 409, 'warn')
  }
}
