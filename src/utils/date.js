'use strict'

const moment = require('moment')

module.exports = {
  defaultFrom: () => new Date(0),
  defaultTo: () => new Date(),

  startOfDay: date => moment(date).startOf('day'),
  endOfDay: date => moment(date).endOf('day'),

  weekAgo: date => moment(date).subtract(7, 'days'),
  monthAgo: date => moment(date).subtract(30, 'days'),

  daysBetween: (startDate, endDate) => moment(endDate).diff(moment(startDate), 'days') + 1,
}
