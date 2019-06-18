'use strict'

const joi = require('joi')

module.exports = {
  register: joi.object().keys({
    going: joi.boolean().required(),
    eventId: joi.number().integer().required(),
  }),
}
