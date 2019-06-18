'use strict'

const joi = require('joi')
const config = require('../../config')

module.exports = {
  register: joi.object().keys({
    email: joi.string().email().required(),
    password: joi.string().min(config.auth.minimalPasswordLength).required(),
    name: joi.string().min(3).required()
      .max(255),
  }),

  contest: joi.object().keys({
    contestId: joi.number().integer().required(),
    name: joi.string().max(255),
    accepted: joi.boolean().required(),
    location: joi.array().items(joi.number().min(-180).max(180)).length(2),
  }),

  update: joi.object().keys({
    oldPassword: joi.string(),
    newPassword: joi.string().min(config.auth.minimalPasswordLength),
    name: joi.string().min(3).max(255),
    weight: joi.number().integer().allow(null),
    height: joi.number().integer().allow(null),
    gender: joi.valid('male', 'female', 'other', null),
    pictureUrl: joi.string().allow(null).max(255),
  }).and('oldPassword', 'newPassword'),

  verifyEmail: joi.object().keys({
    emailVerificationToken: joi.string().required(),
  }),

  requestPasswordReset: joi.object().keys({
    email: joi.string().email().required(),
  }),

  confirmPasswordReset: joi.object().keys({
    passwordResetToken: joi.string().required(),
    newPassword: joi.string().min(config.auth.minimalPasswordLength).required(),
  }),

  pushToken: joi.object().keys({
    deviceId: joi.string(),
    token: joi.string().required(),
  }),
}
