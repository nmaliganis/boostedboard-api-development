'use strict'

const auth = require('./auth-controller')
const user = require('./user-controller')
const aws = require('./aws-controller')
const board = require('./board-controller')
const mileage = require('./mileage-controller')
const ride = require('./ride-controller')
const spot = require('./spot-controller')
const city = require('./city-controller')
const event = require('./event-controller')
const inbox = require('./inbox-controller')

module.exports = {
  auth,
  user,
  aws,
  board,
  mileage,
  ride,
  spot,
  city,
  event,
  inbox,
}
