'use strict'

const compose = require('koa-compose')
const middleware = require('../middleware')
const schema = require('../validation/schema')
const authService = require('../services/auth-service')
const pushTokenService = require('../services/push-token-service')

module.exports = {

  /**
   * Creates a new user access token.
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  native: compose([
    middleware.validation.validateBody(schema.auth.native),
    async ctx => {
      ctx.body = await authService.native(ctx.request.validatedBody, ctx.request)
    },
  ]),

  /**
   * Creates a new user access token for facebook user
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  facebook: compose([
    middleware.validation.validateBody(schema.auth.facebook),
    async ctx => {
      ctx.body = await authService.facebook(ctx.request.validatedBody.facebookAccessToken, ctx.request)
    },
  ]),

  /**
   * Creates a new user access token for google user
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  google: compose([
    middleware.validation.validateBody(schema.auth.google),
    async ctx => {
      ctx.body = await authService.google(ctx.request.validatedBody.googleIdToken, ctx.request)
    },
  ]),

  /**
   * Creates a new access token based on refresh token
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  refresh: compose([
    middleware.validation.validateBody(schema.auth.refresh),
    async ctx => {
      ctx.body = await authService.refresh(ctx.request.validatedBody.refreshToken, ctx.request)
    },
  ]),

  /**
   * Logs user out and removes his push token
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  logout: compose([
    middleware.validation.validateBody(schema.users.pushToken),
    async ctx => {
      const userId = ctx.request.user.id
      const token = ctx.request.validatedBody.token

      await pushTokenService.removeTokenAndUnsubscribe(userId, token)

      ctx.status = 204
    },
  ]),
}
