'use strict'

const Joi = require('joi')
const moment = require('moment')

const customizedJoi = Joi.extend(joi => ({
  base: joi.string(),
  name: 'string',
  language: {
    notValidDateFormat: 'invalid date format, use YYYY-MM-DD',
    notValidDate: 'date is not valid {{q}}',
  },
  rules: [
    {
      name: 'date',
      validate(params, value, state, options) {
        const matches = value.match(/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/u)
        if (!matches) {
          return this.createError('string.notValidDateFormat', { v: value }, state, options) // eslint-disable-line id-length
        }

        if (!moment(value).isValid()) {
          return this.createError('string.notValidDate', { v: value }, state, options) // eslint-disable-line id-length
        }

        // Keep the value as it was
        return value
      },
    },
  ],
}))

module.exports = customizedJoi
