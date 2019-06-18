'use strict'

const { TokenExpiredError } = require('jsonwebtoken')
const errors = require('../common/errors')
const crypt = require('../utils/crypt')
const userService = require('../services/user-service')

module.exports = async (ctx, middleware) => {
  const authorization = ctx.headers.authorization

  ctx.request.user = null
  if (!authorization) {
    return void await middleware()
  }

  let payload
  try {
    payload = crypt.verifyAccessToken(authorization)
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new errors.AccessTokenExpired()
    }
    throw new errors.UnauthorizedError(err.message)
  }

  ctx.request.user = await userService.findByPk(payload.userId)

  await middleware()
}
