'use strict'

const joi = require('joi')

module.exports = {
  create: joi.object().keys({
    boardId: joi.number().integer(),
    startTime: joi.date().iso().required(),
    endTime: joi.date().iso().required(),
    mapDistance: joi.number().required(),
    mapAverageSpeed: joi.number().required(),
    boardDistance: joi.number().required(),
    boardAverageSpeed: joi.number().required(),
    mapTopSpeed: joi.number().required(),
    boardTopSpeed: joi.number().allow(null),
    odometerStart: joi.number().allow(null),
    odometerFinish: joi.number().allow(null),
    breadcrumbs: joi.array().items(joi.object({
      timestamp: joi.date().iso().required(),
      location: joi.array().items(joi.number().min(-180).max(180)).length(2)
        .required(),
      altitude: joi.number().required(),
      boardSpeed: joi.number().allow(null),
      boardBatteryRemaining: joi.number().integer().allow(null),
      boardPowerOutput: joi.number().allow(null),
      boardMode: joi.any().valid([null, 'beginner', 'eco', 'expert', 'pro', 'hyper']),
      alternativeMove: joi.boolean(),
    })).required(),
  }),

  getMine: joi.object().keys({
    offset: joi.number().allow(null),
    limit: joi.number().allow(null),
  }),

  rideIdInPath: joi.object().keys({
    rideId: joi.number().integer().required(),
  }),
}
