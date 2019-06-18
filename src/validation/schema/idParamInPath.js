'use strict'

const joi = require('joi')

module.exports = joi.object().keys({
  id: joi.number().integer().required(),
})
