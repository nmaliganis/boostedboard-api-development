'use strict'

/* eslint-disable function-paren-newline */
const compose = require('koa-compose')
const { validateBody } = require('../../middleware/validation')
const authSchema = require('../../validation/schema/auth')
const authService = require('../../services/admin/auth-service')
const { admin } = require('../../policies')

module.exports = {
  google: compose([
    validateBody(authSchema.google),
    async (ctx, middleware) => {
      ctx.body = await authService.google(ctx.request.validatedBody.googleIdToken, ctx.request)
      ctx.request.user = ctx.body.profile
      await middleware()
    },
    admin,
  ]),
}
