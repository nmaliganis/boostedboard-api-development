'use strict'

const crypt = require('../utils/crypt')

module.exports = {
  /**
   * Assign refresh token to user
   * @param {Model<User>} user User whom to assign refresh token
   * @param {Object} koaRequest request from koa context
   * @param {String} koaRequest.ip IP address
   * @param {String} koaRequest.hearers.user-agent User agent
   * @returns {Promise.<String>}
   */
  async assignRefreshToken(user, koaRequest) {
    const refreshToken = await user.createRefreshToken({
      token: crypt.generateRefreshToken(),
      userAgent: koaRequest.headers['user-agent'],
      ip: koaRequest.ip,
    })

    return refreshToken.token
  },
}
