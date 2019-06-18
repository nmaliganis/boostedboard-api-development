'use strict'

const _ = require('lodash')
const db = require('../database')
const { Ride, Breadcrumb } = require('../database')
const errors = require('../common/errors')
const log = require('../common/logger')

module.exports = {
  /**
   * Creates new ride
   * @param   {Integer} userId  Data of the user.
   * @param   {Object}  data    Data about ride as described in swagger docs
   * @returns {Object}  Created ride
   */
  async create(userId, data) {
    data.userId = userId

    const ride = await db.sequelize.transaction(async transaction => {
      const rideData = _.omit(data, 'breadcrumbs')
      const createdRide = await Ride.create(rideData, { returning: true, transaction })

      data.breadcrumbs.forEach(breadcrumb => (breadcrumb.rideId = createdRide.id))
      await Breadcrumb.bulkCreate(data.breadcrumbs, { transaction })

      return createdRide
    })

    return this.get(ride.id)
  },

  /**
   * @param {Integer} userId              ID of user
   * @param {Object}  [options={}]        Additional options object
   * @param {Integer} [options.limit=]    Limit for pagination
   * @param {Integer} [options.offset=]   Offset for pagination
   * @return {Object<{ stats: { count: Number, mapDistance: Number, boardDistance: Number }, rides: Array<Ride> }>}
   */
  async getByUser(userId, options = {}) {
    // SEQUELIZE BUG: Offset is not working correctly if limit is not set
    if (options.offset && !options.limit) {
      options.limit = 99999
    }
    const { fn, col } = db.Sequelize


    const [stats, rides] = await Promise.all([
      Ride.findOne({
        attributes: [
          [fn('COUNT', '*'), 'count'],
          [fn('SUM', col('mapDistance')), 'sumMapDistance'],
          [fn('SUM', col('boardDistance')), 'sumBoardDistance'],
        ],
        where: { userId },
        raw: true,
      }),

      Ride.findAll({
        where: { userId },
        include: { model: Breadcrumb, attributes: { exclude: ['id', 'rideId'] } },
        order: [['startTime', 'DESC'], [Breadcrumb, 'timestamp', 'ASC']],
        limit: options.limit,
        offset: options.offset,
      }),
    ])

    // parse string to integer
    stats.count = parseInt(stats.count)

    return {
      stats,
      rides,
    }
  },

  /**
   * Get one ride
   * @param {Object}  filter  Filter to search ride by, ideally ID
   * @return {Promise<Ride>}  Found ride
   */
  async get(filter) {
    const ride = await Ride.findOne({
      where: filter,
      include: { model: Breadcrumb, attributes: { exclude: ['id', 'rideId'] } },
      order: [[Breadcrumb, 'timestamp', 'ASC']],
    })

    if (!ride) {
      throw new errors.NotFoundError('Ride was not found.')
    }

    return ride
  },

  /**
   * Updates one ride
   * @param {Object}  filter        Filter to find ride by, ideally id and userId
   * @param {Object}  dataToUpdate  New values for the ride
   * @return {Promise<Ride>}        Updated ride
   */
  async update(filter, dataToUpdate) {
    // For safety, update only one ride. Postgres does not support UPDATE ... LIMIT, so let's find the ride first
    const ride = await Ride.findOne({ where: filter })
    if (!ride) {
      throw new errors.NotFoundError('Ride was not found.')
    }

    await ride.update(dataToUpdate)

    return this.get(ride.id)
  },

  /**
   * Removes a ride defined by its ID and its userId
   * @param   {Integer}   userId    ID of user
   * @param   {Integer}   rideId    ID of ride to delete
   * @return  {Null}
   */
  async remove(userId, rideId) {
    const removedRidesCount = await db.Ride.destroy({ where: { id: rideId, userId } })

    if (removedRidesCount === 0) {
      log.info(`Ride ${rideId} was not found.`)
      throw new errors.NotFoundError('Ride was not found.')
    }

    return null
  },

}
