'use strict'

const _ = require('lodash')
const { CitySubscription, User, City } = require('../database')
const errors = require('../common/errors')
const { citySubscribers } = require('../database/helpers')
const log = require('../common/logger')

async function checkUserAndCityExist(userId, cityId) {
  const [foundUser, foundCity] = await Promise.all([
    await User.findByPk(userId),
    await City.findByPk(cityId),
  ])
  if (!foundUser || !foundCity) {
    const errorMessages = []
    if (!foundUser) {
      log.info(`User with id ${userId} does not exist.`)
      errorMessages.push('Target user does not exist.')
    }
    if (!foundCity) {
      log.info(`City with id ${cityId} does not exist.`)
      errorMessages.push('Target city does not exist.')
    }
    throw new errors.NotFoundError(errorMessages.join('\n'))
  }
  return [foundUser, foundCity]
}

async function checkUserExists(userId) {
  const foundUser = await User.findByPk(userId)
  if (!foundUser) {
    log.info(`User with id ${userId} does not exist.`)
    throw new errors.NotFoundError('Target user does not exist.')
  }
}

function getSubscriptionsHelper(userId) {
  return CitySubscription.findAll({
    where: {
      userId,
    },
    include: [{
      model: City,
    }],
    order: [
      [City, 'name', 'ASC'],
    ],
  })
}

function getCities(subscritions) {
  return subscritions.map(sub => sub.city)
}

module.exports = {
  async subscribeUserToCityEvents(userId, cityId) {
    const [, existingCity] = await checkUserAndCityExist(userId, cityId)

    const existingSubscription = await CitySubscription.findOne({ where: { userId, cityId } })

    if (!existingSubscription) {
      await CitySubscription.create({
        userId,
        cityId,
      })
    }

    if (existingSubscription) {
      log.info(`User with id ${userId} is already subscribed to city with id ${cityId}`)
      throw new errors.ConflictError(`Target user is already subscribed to city ${existingCity.name}`)
    }

    return getCities(getSubscriptionsHelper(userId))
  },

  async unsubscribeUserFromCityEvents(userId, cityId) {
    const [, existingCity] = await checkUserAndCityExist(userId, cityId)

    const removedSubscriptions = await CitySubscription.destroy({ where: { userId, cityId } })
    if (removedSubscriptions === 0) {
      log.info(`Could unsubscribe user with id ${userId} from city ${cityId}, user is not subscribed.`)
      throw new errors.NotFoundError(`Could unsubscribe target user from city ${existingCity.name}, user is not subscribed.`)
    }

    return getCities(getSubscriptionsHelper(userId))
  },

  async getSubscribedCities(userId) {
    const subscriptions = await this.getSubscriptions(userId)
    return getCities(subscriptions)
  },

  async getSubscriptions(userId) {
    await checkUserExists(userId)
    return getSubscriptionsHelper(userId)
  },

  async getSubscriptionSummaries() {
    const result = await citySubscribers()
    const transformedResult = result.map(cityInfo => ({
      subscriberCount: cityInfo.subscriberCount,
      city: _.omit(cityInfo, 'subscriberCount'),
    }))
    return transformedResult
  },
}
