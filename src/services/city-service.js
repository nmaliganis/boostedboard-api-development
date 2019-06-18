'use strict'

const geolib = require('geolib')
const geotz = require('geo-tz')
const db = require('../database')
const { sequelize, Op } = require('../database')
const errors = require('../common/errors')
const config = require('../config')
const { unsubscribedCitiesForUser } = require('../database/helpers')
const log = require('../common/logger')
const eventService = require('./event-service')

module.exports = {
  async register(city) {
    const conflictCity = await db.City.findOne({ where: { name: city.name } })
    if (conflictCity) {
      throw new errors.ConflictError(`The city with name ${city.name} already exists.`)
    }

    if (typeof city.radius === 'undefined') {
      city.radius = config.app.cities.radius
    }

    city.timeZone = geotz(city.location[1], city.location[0])[0]

    await db.City.create(city)

    return db.City.findAll()
  },

  async update(cityId, updateData) {
    const promiseList = [db.City.findByPk(cityId)]

    if (typeof updateData.name !== 'undefined') {
      promiseList.push(db.City.findOne({ where: { name: updateData.name } }))
    }

    const [existingCity, cityWithSameName] = await Promise.all(promiseList)

    if (!existingCity) {
      log.info(`City with id ${cityId} does not exist`)
      throw new errors.NotFoundError('Target city does not exist')
    }

    if (existingCity.name === config.app.cities.testCity.name) {
      throw new errors.ForbiddenError('The test city cannot be changed/updated')
    }

    if (updateData.name) {
      if (cityWithSameName && cityId !== cityWithSameName.id) {
        throw new errors.ConflictError(`City with name ${updateData.name} already exists.`)
      }
    }

    const updateResult = await db.City.update(updateData, { where: { id: cityId }, returning: true })
    if (updateResult[0] === 0) {
      throw new errors.NotFoundError('City to update was not found.')
    }

    return updateResult[1][0]
  },

  async getPossibleCitiesToSubscribe(userId, isAdmin = false, coordinates) {
    let unsubscribedCities = await unsubscribedCitiesForUser(userId)
    unsubscribedCities.forEach(city => {
      city.location = city.location.coordinates
    })

    if (!isAdmin) {
      unsubscribedCities = unsubscribedCities.filter(city => city.name !== config.app.cities.testCity.name)
    }

    if (coordinates) {
      // sort geographically - the closest city first
      const userLocation = { latitude: coordinates[0], longitude: coordinates[1] }
      unsubscribedCities.sort((first, second) => {
        const firstLocation = { latitude: first.location[1], longitude: first.location[0] }
        const secondLocation = { latitude: second.location[1], longitude: second.location[0] }

        const firstDistance = geolib.getDistance(userLocation, firstLocation)
        const secondDistance = geolib.getDistance(userLocation, secondLocation)

        return firstDistance - secondDistance
      })
    } else {
      // sort alphabetically
      unsubscribedCities.sort((first, second) => {
        if (first.name < second.name) {
          return -1
        }
        if (first.name > second.name) {
          return 1
        }
        return 0
      })
    }

    return unsubscribedCities
  },

  async getAll(isAdmin = false) {
    const allCities = await db.City.findAll()
    if (isAdmin) {
      return allCities
    }
    return allCities.filter(city => city.name !== config.app.cities.testCity.name)
  },

  async getById(cityId) {
    const foundCity = await db.City.findByPk(cityId)

    if (!foundCity) {
      log.info(`City with id ${cityId} was not found.`)
      throw new errors.NotFoundError('Target city was not found.')
    }

    return foundCity
  },

  async remove(cityId) {
    const eventsInCity = await eventService.getAllInCity(cityId)

    if (eventsInCity.length !== 0) {
      log.info(`Cannot delete the city with id ${cityId},
      because there is ${eventsInCity.length} events happening in th city`)
      throw new errors.ConflictError(`Cannot delete target city
      because there is ${eventsInCity.length} events happening in th city`)
    }

    const existingCity = await db.City.findByPk(cityId)
    if (!existingCity) {
      log.info(`City with id ${cityId} does not exist`)
      throw new errors.NotFoundError('Target city does not exist')
    }

    if (existingCity.name === config.app.cities.testCity.name) {
      throw new errors.ForbiddenError('Test city cannot be deleted')
    }

    try {
      await sequelize.transaction(async transaction => {
        await db.CitySubscription.destroy({ where: { cityId }, force: true, transaction })
        await db.City.destroy({ where: { id: cityId }, transaction })
      })
    } catch (err) {
      throw new errors.InternalServerError('Failure executing DB transaction - deleting a City/City subscriptions')
    }

    return db.City.findAll()
  },

  async cityQuery(longitude, latitude) {
    const userLocation = { latitude, longitude }

    const cities = await db.City.findAll({ where: { name: {
      [Op.ne]: config.app.cities.testCity.name,
    } } })

    let closestDistance = Number.MAX_SAFE_INTEGER
    let resultCity = null

    cities.forEach(city => {
      const cityLocation = { latitude: city.location[1], longitude: city.location[0] }
      const distance = geolib.getDistance(userLocation, cityLocation)

      if (distance < city.radius && distance < closestDistance) {
        closestDistance = distance
        resultCity = city
      }
    })

    return resultCity
  },
}
