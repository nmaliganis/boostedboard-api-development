'use strict'

const googleAuth = require('../../utils/google-auth')
const { Board, User } = require('../../database')
const log = require('../../common/logger')
const awsService = require('../aws-service')
const { userProfile, userRoleFromEmail } = require('../../utils')

module.exports = {
  /**
   * Register or login google user
   * @param {String} googleIdToken - googleIdToken to log in by
   * @param {Object} koaRequest - request from koa context
   * @returns {Promise<Object>} Auth response
   */
  async google(googleIdToken, koaRequest) {
    const tokenInfo = await googleAuth.verifyIdToken(googleIdToken)
    const googleUser = tokenInfo.getPayload()

    const existingUser = await User.findOne({
      where: { googleId: googleUser.sub },
      include: [Board],
    })

    if (existingUser) {
      return userProfile(existingUser, false, koaRequest)
    }

    const newUser = await User.create({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.sub,
      isEmailVerified: true,
      role: userRoleFromEmail(googleUser.email),
    })

    try {
      const uploadedPictureUrl = await awsService.uploadFileFromURL(googleUser.picture)
      await newUser.update({ pictureUrl: uploadedPictureUrl })
    } catch (err) {
      log.error({ err }, 'Cannot set google user picture.')
    }

    return userProfile(newUser, true, koaRequest)
  },
}
