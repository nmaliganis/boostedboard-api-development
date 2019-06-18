'use strict'

const joi = require('joi')

module.exports = {
  currentLocation: joi.object().keys({
    long: joi.number().min(-180).max(180)
      .required(),
    lat: joi.number().min(-180).max(180)
      .required(),
  }),

  locationForSorting: joi.alternatives().try(
    joi.object().keys({
      long: joi.number().min(-180).max(180)
        .required(),
      lat: joi.number().min(-180).max(180)
        .required(),
    }),
    joi.object().length(0),
  ),

  subscribe: joi.object().keys({
    cityId: joi.number().integer().required(),
  }),
}
