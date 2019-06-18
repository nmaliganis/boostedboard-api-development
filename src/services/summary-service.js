'use strict'

const { monthAgo, weekAgo } = require('../utils/date')
const { kilometersToRoundedMiles } = require('../utils')
const userService = require('./user-service')
const boardService = require('./board-service')
const mileageService = require('./mileage-service')

module.exports = {
  async userSummary() {
    const today = (new Date()).toISOString()

    return {
      totalCount: await userService.countAll(),
      today: await userService.count({ from: today, to: today }),
      last7days: await userService.count({ from: weekAgo(today), to: today }),
      last30days: await userService.count({ from: monthAgo(today), to: today }),
    }
  },

  async mileageSummary() {
    const today = (new Date()).toISOString()

    return {
      totalCount: kilometersToRoundedMiles(await mileageService.sumAll()),
      today: kilometersToRoundedMiles(await mileageService.sum({ from: today, to: today })),
      last7days: kilometersToRoundedMiles(await mileageService.sum({ from: weekAgo(today), to: today })),
      last30days: kilometersToRoundedMiles(await mileageService.sum({ from: monthAgo(today), to: today })),
    }
  },

  async boardSummary() {
    return {
      boardRegistrations: await boardService.countAll(),
      connectedBoards: await mileageService.boardsCount(),
    }
  },
}
