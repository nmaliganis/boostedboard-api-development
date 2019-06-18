'use strict'

const { EventRegistration, User, Event, CitySubscription } = require('../database')
const errors = require('../common/errors')
const log = require('../common/logger')

module.exports = {
  async register(userId, eventId, going) {

    const foundUserPromise = User.findByPk(userId)
    const foundEventPromise = Event.findByPk(eventId)
    const existingRegistrationPromise = EventRegistration.findOne({ where: { userId, eventId } })

    const [
      foundUser,
      foundEvent,
      existingRegistration,
    ] = await Promise.all([
      foundUserPromise,
      foundEventPromise,
      existingRegistrationPromise,
    ])

    if (!foundUser || !foundEvent) {
      const errorMessages = []
      if (!foundUser) {
        log.info(`User with id ${userId} does not exist.`)
        errorMessages.push('Target user does not exist.')
      }
      if (!foundEvent) {
        log.info(`Event with id ${eventId} does not exist.`)
        errorMessages.push('Target event does not exist.')
      }
      throw new errors.NotFoundError(errorMessages.join('\n'))
    }

    if (existingRegistration) {
      await existingRegistration.update({ going })
    } else {
      // Check if user is trying to respond to an event in a city for which he is not subscribed
      if (foundEvent.cityId !== null) {
        const subsriptionToEventCity = await CitySubscription.findOne({ where: { userId, cityId: foundEvent.cityId } })
        if (!subsriptionToEventCity) {
          log.info(`Event with id ${eventId} not found within the subscribed cities`)
          throw new errors.NotFoundError('Target event not found within the subscribed cities')
        }
      }

      await EventRegistration.create({ userId, eventId, going })
    }
  },
}
