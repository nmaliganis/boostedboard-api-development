'use strict'

const joi = require('joi')

module.exports = joi.object().keys({
  messageId: joi.object().required().keys({
    eventId: joi.number().integer().required(),
  }).length(1),
  messageState: joi.string().required().valid(['seen', 'deleted']),
})
