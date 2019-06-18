'use strict'

const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../config')

const BEARER_PREFIX = 'Bearer '

module.exports = {

  generateAccessToken(userId, options) {
    const payload = { userId }
    const mergedOptions = { ...config.auth.createOptions, ...options }
    return jwt.sign(payload, config.auth.secret, mergedOptions)
  },

  verifyAccessToken(authToken) {
    const token = authToken.replace(BEARER_PREFIX, '')
    return jwt.verify(token, config.auth.secret, config.auth.verifyOptions)
  },

  hashPassword(password) {
    return bcrypt.hash(password, config.auth.saltRounds)
  },

  comparePasswords(plaintext, ciphertext) {
    return bcrypt.compare(plaintext, ciphertext)
  },

  /**
   * Create token for email address verification
   * @param {Integer} userId ID of user
   * @param {String} email Email of user
   * @returns {String} verify email token
   */
  generateEmailVerificationToken(userId, email) {
    const payload = { userId, email }
    return jwt.sign(payload, config.auth.secret, config.auth.createEmailVerificationToken)
  },

  /**
   * Verify token from email address verification token
   * @param {String} token Token from email
   * @returns {Object|Bool} ID of token's user or false if token not valid
   */
  verifyEmailVerificationToken(token) {
    return jwt.verify(token, config.auth.secret, config.auth.createEmailVerificationToken)
  },

  generatePasswordResetToken(userId, email) {
    const payload = { userId, email }
    return jwt.sign(payload, config.auth.secret, config.auth.createPasswordResetToken)
  },

  verifyPasswordResetToken(token) {
    return jwt.verify(token, config.auth.secret, config.auth.createPasswordResetToken)
  },

  generateRefreshToken() {
    return crypto.randomBytes(config.auth.refreshTokenLength).toString('hex')
  },
}
