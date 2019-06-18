'use strict'

const config = require('./index')

module.exports = {
  url: config.database.connectionString,
  dialectOptions: config.database.options.dialectOptions,
  dialect: 'postgres',
}
