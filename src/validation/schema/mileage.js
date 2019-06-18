'use strict'

const joi = require('joi')

exports.register = joi.object().keys({
  boardId: joi.string().max(255),
  odometerTotal: joi.number().required(),
  odometerDifference: joi.number().required(),
  differenceSince: joi.date().required(),
  userId: joi.number().allow(null),
})
