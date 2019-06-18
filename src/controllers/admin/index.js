'use strict'

const auth = require('./auth-controller')
const board = require('./board-controller')
const mileage = require('./mileage-controller')
const user = require('./user-controller')
const city = require('./city-controller')
const event = require('./event-controller')

module.exports = {
  auth,
  board,
  mileage,
  user,
  city,
  event,
}
