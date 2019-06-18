'use strict'

const joi = require('joi')

module.exports = {
  create: joi.object().keys({
    name: joi.string().required().max(255),
    description: joi.string().required().min(60),
    startDate: joi.date().required(),
    endDate: joi.date().required(),
    location: joi.string().max(255),
    cityId: joi.number().integer().allow(null).required(),
    imageUrl: joi.string().max(255),
    link: joi.object().allow(null).keys({
      text: joi.string().required().max(255),
      url: joi.string().required().max(255),
    }),
  }),

  update: joi.object().keys({
    name: joi.string().max(255),
    description: joi.string(),
    startDate: joi.date(),
    endDate: joi.date(),
    location: joi.string().max(255),
    cityId: joi.number().integer().allow(null),
    imageUrl: joi.string().max(255),
    link: joi.object().allow(null).keys({
      text: joi.string().required().max(255),
      url: joi.string().required().max(255),
    }),
  }).min(1),
}
