'use strict'

const joi = require('joi')

exports.signedUrl = joi.object().keys({
  contentType: joi.string().allow(null),
})
