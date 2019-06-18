'use strict'

const ApiError = require('./apiError')

module.exports = class AccessTokenExpired extends ApiError {
  constructor(message = 'Authorization access token has expired.') {
    super('E_ACCESS_TOKEN_EXPIRED', message, 412, 'info')
  }
}
