'use strict'

const GoogleAuth = require('google-auth-library')
const Bluebird = require('bluebird')
const googleConfig = require('../config').google

module.exports = {
  verifyIdToken(googleIdToken) {
    const googleOAuthClient = new GoogleAuth.OAuth2Client()

    return Bluebird.fromCallback(done =>
      googleOAuthClient.verifyIdToken({
        idToken: googleIdToken,
        audience: googleConfig.clientId,
      }, done))
  },
}
