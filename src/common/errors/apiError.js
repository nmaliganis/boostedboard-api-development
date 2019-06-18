'use strict'

module.exports = class ApiError extends Error {
  constructor(type, message, status, logLevel = 'error') {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.type = type
    this.status = status
    this.logLevel = logLevel
  }
}
