'use strict'

const config = require('../config')
const userRoles = require('../services/user/enums').roles
const tokenService = require('../services/token-service')
const crypt = require('./crypt')

const getDomainFromEmailAddress = email => email.substring(email.lastIndexOf('@') + 1)

module.exports = {
  generateEmailVerificationLink: (userId, email) =>
    `https://${config.server.frontendHost}/welcome?token=${crypt.generateEmailVerificationToken(userId, email)}`,

  generatePasswordResetLink: (userId, email) =>
    `https://${config.server.frontendHost}/password?token=${crypt.generatePasswordResetToken(userId, email)}`,

  userRoleFromEmail: email => {
    const domain = getDomainFromEmailAddress(email)

    if (domain === config.app.adminEmailDomain) {
      return userRoles.ADMIN
    }

    return userRoles.USER
  },

  userProfile: async (user, isNewUser, koaRequest) => ({
    accessToken: crypt.generateAccessToken(user.id),
    refreshToken: await tokenService.assignRefreshToken(user, koaRequest),
    profile: user,
    isNewUser,
  }),

  convertMetersToRoundedMiles: meters => Math.round(meters * 0.000621371192),
  kilometersToRoundedMiles: meters => Math.round(meters * 0.621371192),
}
