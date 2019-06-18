'use strict'

const { prepareDb } = require('../data/cleaner')

before(function databaseSetup() {
  this.timeout(20000)
  return prepareDb()
})
