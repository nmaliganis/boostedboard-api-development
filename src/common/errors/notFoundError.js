'use strict'

const ApiError = require('./apiError')

module.exports = class NotFoundError extends ApiError {
  constructor(message = 'Target resource was not found.') {
    super('E_NOT_FOUND', message, 404, 'warn')
  }
}
