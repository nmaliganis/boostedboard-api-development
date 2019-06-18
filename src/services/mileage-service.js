'use strict'

const { DailyAverage, Mileage, Op } = require('../database')
const { dailyAveragesFromMileage, totalMileage } = require('../database/helpers')
const { startOfDay, endOfDay } = require('../utils/date')
const { ConflictError } = require('../common/errors')

module.exports = {
  async register(data) {
    const existingRecord = await Mileage.findOne({
      where: { boardId: data.boardId || null, differenceSince: data.differenceSince },
    })

    if (existingRecord) {
      throw new ConflictError('Mileage record with this "boardId" and "differenceSince" found.')
    }

    // odometer values are received as kilometers
    const mileage = await Mileage.create(data)
    await dailyAveragesFromMileage(mileage)
  },

  /**
   * Return sum of all odometerTotal max values grouped by boardId
   * @return {Promise<Number>}
   */
  async sumAll() {
    const result = await totalMileage()

    return Number(result[0].sum)
  },

  /**
   * @param {Object} options options for querying
   * @param {String} options.from start date for sum limit
   * @param {String} options.to end date for sum limit
   * @returns {Promise<number>}
   */
  async sum(options) {
    const from = options.from
    const to = options.to

    const result = await DailyAverage.sum('average', {
      where: {
        day: {
          [Op.gte]: startOfDay(from).format('YYYY-MM-DD'),
          [Op.lte]: endOfDay(to).format('YYYY-MM-DD'),
        },
      },
    })

    return result || 0
  },

  /**
   * Return count of all boards that gathered mileage
   * @returns {Promise<number>}
   */
  boardsCount() {
    return Mileage.count({ distinct: true, col: 'boardId' })
  },
}
