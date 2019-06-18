'use strict'

const errorHandling = require('./error-handling')
const auth = require('./authorization')
const validation = require('./validation')
const docs = require('./docs')

module.exports = {
  errors: errorHandling,
  auth,
  docs,
  validation,
}
