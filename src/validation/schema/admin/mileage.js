'use strict'

const joi = require('../../joi')

const sum = joi.object().keys({
  from: joi.string().date().allow(null),
  to: joi.string().date().allow(null),
}).and('from', 'to')

module.exports = {
  sum,
}
