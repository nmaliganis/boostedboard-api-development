'use strict'

const ApiError = require('./apiError')

module.exports = class ValidationError extends ApiError {
  constructor(message = 'Validation did not passed.') {
    super('E_VALIDATION', message, 400, 'warn')
  }
}
