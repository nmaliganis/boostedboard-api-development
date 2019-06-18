'use strict'

const user = require('./user')
const pushToken = require('./push-token')
const refreshToken = require('./refresh-token')
const board = require('./board')
const mileage = require('./mileage')
const dailyAverage = require('./daily-average')
const ride = require('./ride')
const breadcrumb = require('./breadcrumb')
const spot = require('./spot')
const city = require('./city')
const citySubscription = require('./city-subscription')
const event = require('./event')
const eventRegistration = require('./event-registration')
const messageInteraction = require('./message-interaction')
const subscriptionArn = require('./subscription-arn')

module.exports = {
  user,
  pushToken,
  refreshToken,
  board,
  mileage,
  dailyAverage,
  ride,
  breadcrumb,
  spot,
  city,
  citySubscription,
  event,
  eventRegistration,
  messageInteraction,
  subscriptionArn,
}
