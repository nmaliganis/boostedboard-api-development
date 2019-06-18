'use strict'

const db = require('../database')
const { Spot } = require('../database')
const errors = require('../common/errors')
const log = require('../common/logger')

module.exports = {
  /**
   * Creates a new spot
   * @param   {Integer} userId    ID of user creating the spot
   * @param   {Object}  spotData  Data about spot as described in swagger docs
   * @returns {Object}  Created spot
   */
  async create(userId, spotData) {
    spotData.userId = userId
    const spot = await Spot.create(spotData, { returning: true })

    return this.get(spot.id)
  },

  /**
   * Get a spot based on its ID
   * @param   {Integer} spotId  ID of spot
   * @returns {Object}  The requested spot
   */
  async get(spotId) {
    const spot = await Spot.findOne({ where: { id: spotId } })

    if (!spot) {
      log.info(`Spot ${spotId} was not found.`)
      throw new errors.NotFoundError('Spot was not found.')
    }

    return spot
  },

  /**
   * Get spots in radius of point
   * @param {Number}  lat     Latitude to find around
   * @param {Number}  lng     Longitude to find around
   * @param {Number}  radius  Distance in meters to find around
   * @param {String}  [type=] Type of the spot
   * @return {Promise<Array<Spot>>} Spots in area
   */
  getInRadius(lat, lng, radius, type) {
    const { fn, col, Op } = db.Sequelize
    const centerPoint = fn('ST_MakePoint', lng, lat)

    return Spot.findAll({
      where: {
        [Op.and]: [
          fn('ST_DWithin', col('location'), centerPoint, radius),
          type ? { type } : null,
        ],
      },
    })
  },

  /**
   * Removes a spot defined by its ID and its userId
   * @param   {Integer}   userId    ID of user
   * @param   {Integer}   spotId    ID of spot to delete
   * @return  {Integer}   Number of removed spots
   */
  async remove(userId, spotId) {
    const removedSpotsCount = await Spot.destroy({ where: { id: spotId, userId } })

    if (removedSpotsCount === 0) {
      log.info(`Spot ${spotId} was not found.`)
      throw new errors.NotFoundError('Spot was not found.')
    }

    return removedSpotsCount
  },
}
