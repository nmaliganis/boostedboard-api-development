'use strict'

const auth = require('./auth')
const users = require('./users')
const aws = require('./aws')
const boards = require('./boards')
const mileage = require('./mileage')
const rides = require('./rides')
const spots = require('./spots')
const city = require('./city')
const eventRegistration = require('./eventRegistration')
const idParamInPath = require('./idParamInPath')
const messageInteraction = require('./messageInteraction')
const events = require('./events')

module.exports = {
  auth,
  users,
  aws,
  boards,
  mileage,
  rides,
  spots,
  city,
  eventRegistration,
  idParamInPath,
  messageInteraction,
  events,
}
