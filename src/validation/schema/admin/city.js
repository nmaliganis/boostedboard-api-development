'use strict'

const joi = require('joi')

module.exports = {
  create: joi.object().keys({
    name: joi.string().required().max(255),
    location: joi.array().items(joi.number().min(-180).max(180)).length(2).required(),
    radius: joi.number().integer().optional().min(0),
    imageUrl: joi.string().max(255),
  }),

  update: joi.object().keys({
    name: joi.string().max(255),
    location: joi.array().items(joi.number().min(-180).max(180)).length(2),
    radius: joi.number().integer().min(0),
    imageUrl: joi.string().max(255),
  }).min(1),
}
