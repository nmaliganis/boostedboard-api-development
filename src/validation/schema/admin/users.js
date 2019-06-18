'use strict'

const joi = require('../../joi')
const { SEARCHABLE_BOARD_COLUMNS, SEARCHABLE_USER_COLUMNS } = require('../../../database/helpers')

const index = joi.object().keys({
  offset: joi.number().allow(null),
  limit: joi.number().allow(null),
  orderColumn: joi.string().allow(null).valid(['name', 'createdAt']),
  orderDirection: joi.string().allow(null).valid(['asc', 'desc']),
  searchColumn: joi.string().allow(null).valid([...SEARCHABLE_USER_COLUMNS, ...SEARCHABLE_BOARD_COLUMNS]),
  searchQuery: joi.string().allow(null),
}).and('offset', 'limit')
  .and('orderColumn', 'orderDirection')
  .and('searchColumn', 'searchQuery')

const count = joi.object().keys({
  from: joi.string().date().allow(null),
  to: joi.string().date().allow(null),
}).and('from', 'to')

module.exports = {
  index,
  count,
}
