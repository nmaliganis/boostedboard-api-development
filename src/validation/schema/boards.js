'use strict'

const joi = require('joi')

module.exports = {
  register: joi.object().keys({
    serial: joi
      .string()
      .min(9)
      .max(9)
      .required(),
    name: joi
      .string()
      .min(3)
      .required()
      .max(255),
    motorDriverSerial: joi.string().max(255),
    batterySerial: joi.string().max(255),
    purchaseLocation: joi.string().valid(['Boostedboards.com', 'Amazon', 'Best Buy', 'Retail Store', 'Used board', 'Other']),
    firmwareVersion: joi.string().max(255),
    type: joi.string().valid(['unknown', 'single', 'dual', 'dual+', 'plus', 'stealth', 'mini s', 'mini x', 'rev']),
  }),

  update: joi.object().keys({
    serial: joi
      .string()
      .min(9)
      .max(9),
    name: joi.string().min(3).max(255),
    motorDriverSerial: joi.string().max(255),
    batterySerial: joi.string().max(255),
    purchaseLocation: joi.string().valid(['Boostedboards.com', 'Amazon', 'Best Buy', 'Retail Store', 'Used board', 'Other']),
    firmwareVersion: joi.string().max(255),
    type: joi.string().valid(['unknown', 'single', 'dual', 'dual+', 'plus', 'stealth', 'mini s', 'mini x', 'rev']),
  })
    .min(1),
}
