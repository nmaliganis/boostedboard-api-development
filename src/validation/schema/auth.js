'use strict'

const joi = require('joi')

module.exports = {
  native: joi.object().keys({
    email: joi.string().email().required(),
    password: joi.string().required(),
  }),

  facebook: joi.object().keys({
    facebookAccessToken: joi.string().token().required(),
  }),

  google: joi.object().keys({
    googleIdToken: joi.string().required(),
  }),

  refresh: joi.object().keys({
    refreshToken: joi.string().required(),
  }),
}
