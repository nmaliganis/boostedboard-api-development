'use strict'

const FB = require('fb')
const GoogleAuth = require('google-auth-library')
const Bluebird = require('bluebird')
const config = require('../config')
const errors = require('../common/errors')
const db = require('../database')
const crypt = require('../utils/crypt')
const log = require('../common/logger')
const utils = require('../utils')
const awsService = require('./aws-service')
const tokenService = require('./token-service')

const facebookApplication = new FB.Facebook(config.facebook.sdkOptions)
const googleOAuthClient = new GoogleAuth.OAuth2Client()

module.exports = {
  /**
   * Check if the user with email + password is in the database
   * @param {Object} credentials - email and password
   * @param {Object} koaRequest - request from koa context
   * @param {Boolean=} requireEmailVerification - overdrive if the verified email is required
   * @returns {Promise<Object>} Auth response
   */
  async native(credentials, koaRequest, requireEmailVerification = true) {
    const user = await db.User.findOne({ where: { email: credentials.email, password: { [db.Op.not]: null } },
      include: [
        db.Board, {
          model: db.City,
          as: 'subscribedCities',
          through: { attributes: [] },
        },
      ] })
    if (!user) {
      throw new errors.NotFoundError('User was not found.')
    }

    const passwordMatches = await crypt.comparePasswords(credentials.password, user.password)
    if (!passwordMatches) {
      throw new errors.UnauthorizedError('Wrong password')
    }

    if (requireEmailVerification && !user.isEmailVerified) {
      throw new errors.UnauthorizedError('The email address is not verified, check your inbox please.')
    }

    return {
      accessToken: crypt.generateAccessToken(user.id),
      refreshToken: await tokenService.assignRefreshToken(user, koaRequest),
      profile: user,
      isNewUser: false,
    }
  },

  /**
   * Register or login facebook user
   * @param {String} facebookAccessToken - facebookAccessToken to log in by
   * @param {Object} koaRequest - request from koa context
   * @returns {Promise<Object>} Auth response
   */
  async facebook(facebookAccessToken, koaRequest) {
    const fb = facebookApplication.withAccessToken(facebookAccessToken)
    const facebookUser = await fb.api('/me', { fields: ['id', 'email', 'name', 'short_name', 'picture'] })

    const user = await db.User.findOrCreate({ where: { facebookId: facebookUser.id },
      defaults: { email: facebookUser.email, name: facebookUser.name },
      include: [
        db.Board, {
          model: db.City,
          as: 'subscribedCities',
          through: { attributes: [] },
        },
      ] })

    if (user[1]) {
      // assign user a profile picture from his facebook account
      try {
        if (!facebookUser.picture.data.is_silhouette) {
          const facebookUserPicture = await fb.api('/me/picture', { redirect: false, width: 200, height: 200 })
          const uploadedPictureUrl = await awsService.uploadFileFromURL(facebookUserPicture.data.url)
          await user[0].update({ pictureUrl: uploadedPictureUrl })
        }
      } catch (err) {
        log.error({ err }, 'Cannot set facebook user picture.')
      }
    }

    return {
      accessToken: crypt.generateAccessToken(user[0].id),
      refreshToken: await tokenService.assignRefreshToken(user[0], koaRequest),
      profile: user[0],
      isNewUser: user[1],
    }
  },

  /**
   * Register or login google user
   * @param {String} googleIdToken - googleIdToken to log in by
   * @param {Object} koaRequest - request from koa context
   * @returns {Promise<Object>} Auth response
   */
  async google(googleIdToken, koaRequest) {
    const tokenInfo = await Bluebird.fromCallback(done =>
      googleOAuthClient.verifyIdToken({
        idToken: googleIdToken,
        audience: config.google.clientId,
      }, done))
    const googleUser = tokenInfo.getPayload()

    if (!googleUser.email_verified) {
      throw new errors.ValidationError('Google account needs a verified email address.')
    }

    const user = await db.User.findOrCreate({ where: { googleId: googleUser.sub },
      defaults: { email: googleUser.email, name: googleUser.name, role: utils.userRoleFromEmail(googleUser.email) },
      include: [
        db.Board, {
          model: db.City,
          as: 'subscribedCities',
          through: { attributes: [] },
        },
      ] })

    // if it is a new user
    if (user[1]) {
      // assign user a profile picture from his facebook account
      try {
        const uploadedPictureUrl = await awsService.uploadFileFromURL(googleUser.picture)
        await user[0].update({ pictureUrl: uploadedPictureUrl })
      } catch (err) {
        log.error({ err }, 'Cannot set google user picture.')
      }
    }

    return {
      accessToken: crypt.generateAccessToken(user[0].id),
      refreshToken: await tokenService.assignRefreshToken(user[0], koaRequest),
      profile: user[0],
      isNewUser: user[1],
    }
  },

  /**
   * Log in user based on refresh token
   * @param {String} refreshToken - refreshToken to log in by
   * @param {Object} koaRequest - request from koa context
   * @returns {Promise<Object>} Auth response
   */
  async refresh(refreshToken, koaRequest) {
    const refreshTokenFound = await db.RefreshToken.findOne({
      where: { token: refreshToken },
      include: [{ model: db.User,
        include: [
          db.Board, {
            model: db.City,
            as: 'subscribedCities',
            through: { attributes: [] },
          },
        ] }],
    })

    if (!refreshTokenFound || !refreshTokenFound.user) {
      throw new errors.NotFoundError('Refresh token or its user was not found')
    }

    // if user is email + password based and his email is not verified
    if (refreshTokenFound.user.password !== null && refreshTokenFound.user.isEmailVerified !== true) {
      throw new errors.UnauthorizedError('You need to verify your email address. Please check your inbox.')
    }

    await refreshTokenFound.destroy()

    const user = refreshTokenFound.user
    return {
      accessToken: crypt.generateAccessToken(user.id),
      refreshToken: await tokenService.assignRefreshToken(user, koaRequest),
      profile: user,
      isNewUser: false,
    }
  },

  // exports for stubbing purposes in tests
  facebookApplication,
  googleOAuthClient,
}
