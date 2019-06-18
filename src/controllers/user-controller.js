'use strict'

const jwt = require('jsonwebtoken')
const compose = require('koa-compose')
const middleware = require('../middleware')
const schema = require('../validation/schema')
const userService = require('../services/user-service')
const boardService = require('../services/board-service')
const authService = require('../services/auth-service')
const tokenService = require('../services/token-service')
const emailService = require('../services/email')
const pushTokenService = require('../services/push-token-service')
const notificationService = require('../services/notification')
const db = require('../database')
const crypt = require('../utils/crypt')
const errors = require('../common/errors')
const utils = require('../utils')
const config = require('../config')
const log = require('../common/logger')

module.exports = {
  /**
   * Creates a new user account based on sent credentials.
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  register: compose([
    middleware.validation.validateBody(schema.users.register),
    async ctx => {
      const body = ctx.request.validatedBody

      const user = await userService.register(body)

      const authResponse = await authService.native(body, ctx.request, false)
      authResponse.accessToken = await crypt.generateAccessToken(authResponse.profile.id, { expiresIn: '24h' })
      authResponse.isNewUser = true

      const emailVerificationLink = utils.generateEmailVerificationLink(user.id, user.email)
      await emailService.sendByTemplate('verifyEmailAddress', user.email, { link: emailVerificationLink })

      // Send response
      ctx.status = 201
      ctx.body = authResponse
    },
  ]),

  /**
   * Returns info about currently logged in user
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  getMe: async ctx => {
    ctx.body = {
      profile: await userService.findByPkWithBoards(ctx.request.user.id),
    }
  },

  /**
   * Updates currently logged in user
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  updateMe: compose([
    middleware.validation.validateBody(schema.users.update),
    async ctx => {
      const profile = await userService.update(ctx.request.user.id, ctx.request.validatedBody)
      const boards = await boardService.findByUserId(ctx.request.user.id)

      ctx.body = {
        profile: { ...profile.toJSON(), boards },
      }
    },
  ]),

  /**
   * Sets user's email as verified
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  verifyEmail: compose([
    middleware.validation.validateBody(schema.users.verifyEmail),
    async ctx => {
      let tokenInfo
      try {
        tokenInfo = crypt.verifyEmailVerificationToken(ctx.request.validatedBody.emailVerificationToken)
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          tokenInfo = jwt.decode(ctx.request.validatedBody.emailVerificationToken)
          const emailVerificationLink = utils.generateEmailVerificationLink(tokenInfo.userId, tokenInfo.email)
          await emailService.sendByTemplate('verifyEmailAddress', tokenInfo.email, { link: emailVerificationLink })
          throw new errors.ValidationError('Email token has expired. We just sent you a new one, please check your inbox.')
        }

        throw err
      }

      const updateResult = await db.User.update(
        { isEmailVerified: true },
        { where: { id: tokenInfo.userId, email: tokenInfo.email }, returning: true },
      )

      const user = updateResult[1][0]

      ctx.body = {
        accessToken: crypt.generateAccessToken(user.id),
        refreshToken: await tokenService.assignRefreshToken(user, ctx.request),
        profile: user,
        isNewUser: true,
      }
    },
  ]),

  requestPasswordReset: compose([
    middleware.validation.validateBody(schema.users.requestPasswordReset),
    async ctx => {
      await userService.requestPasswordReset(ctx.request.validatedBody.email)

      ctx.status = 204
    },
  ]),

  confirmPasswordReset: compose([
    middleware.validation.validateBody(schema.users.confirmPasswordReset),
    async ctx => {
      const body = ctx.request.validatedBody
      await userService.confirmPasswordReset(body.passwordResetToken, body.newPassword)

      ctx.status = 204
    },
  ]),

  /**
   * Update push token for specified device.
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  updateToken: compose([
    middleware.validation.validateBody(schema.users.pushToken),

    async ctx => {
      const userId = ctx.request.user.id
      const token = ctx.request.validatedBody.token
      const deviceId = ctx.request.validatedBody.deviceId

      const existingToken = await pushTokenService.checkIfTokenExists(userId, token, deviceId)
      if (!existingToken) {
        log.info('Token not found in DB, creating record')
        const endpointArn = await notificationService.generatePlatformEndpointArn({ token, deviceId })
        const newTokenData = { userId, token, deviceId, endpointArn }

        const createdToken = await db.PushToken.create(newTokenData)

        const generalTopicsubscriptionArn = (await notificationService.subscribeToTopic(config.aws.sns.generalTopicArn, endpointArn)).subscriptionArn
        const subscription = { userId, cityId: null, pushTokenId: createdToken.id, arn: generalTopicsubscriptionArn }
        await db.SubscriptionArn.create(subscription)
      } else if (existingToken.enabled === false) {
        await existingToken.update({ enabled: true })
        await notificationService.enableEndpoint(existingToken.endpointArn)
        await notificationService.subscribeToTopic(config.aws.sns.generalTopicArn, existingToken.endpointArn)
      }

      ctx.status = 204
    },
  ]),
}
