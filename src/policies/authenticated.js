'use strict'

const { UnauthorizedError } = require('../common/errors')

module.exports = async (ctx, middleware) => {
  if (!ctx.request.user) {
    throw new UnauthorizedError()
  }

  await middleware()
}
