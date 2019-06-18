'use strict'

const compose = require('koa-compose')
const { ForbiddenError } = require('../common/errors')
const authenticated = require('./authenticated')

module.exports = compose([
  authenticated,
  async (ctx, middleware) => {
    if (!ctx.request.user.isAdmin()) {
      throw new ForbiddenError()
    }

    await middleware()
  },
])
