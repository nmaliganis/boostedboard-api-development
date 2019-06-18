'use strict'

const joi = require('joi')

module.exports = {
  create: joi.object().keys({
    type: joi.string().valid('charging', 'hazard').required(),
    location: joi.array().items(joi.number().min(-180).max(180)).length(2)
      .required(),
  }),

  getInRadius: joi.object().keys({
    lat: joi.number()
      .min(-90)
      .max(90)
      .required(),
    lng: joi.number()
      .min(-180)
      .max(180)
      .required(),
    radius: joi.number().min(0).required(),
    type: joi.string().valid('charging', 'hazard', null),
  }),

  spotIdInPath: joi.object().keys({
    spotId: joi.number().integer().required(),
  }),
}
