'use strict'

const joi = require('joi')

module.exports = {
  readEventFlag: joi.object().keys({
    read: joi.boolean(),
  }),
}
