'use strict'

const db = require('../database')
const errors = require('../common/errors')
const { sequelize } = require('../database')
const { eventsForUser } = require('../database/helpers')
/* eslint-disable-next-line no-inline-comments */
const { eventsForAdminsWithRPSV, singleEventForUser /* eventsInCityForAdminsWithRPSV */ } = require('../database/helpers')
const config = require('../config')
const log = require('../common/logger')
const notificationService = require('./notification')
const messageStateService = require('./message-state-service')

function isDateInPast(date) {
  const now = new Date()
  const currentDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return date < currentDate
}

function transformEventFromDb(oldEvent) {
  const event = oldEvent.dataValues ? { ...oldEvent.dataValues } : { ...oldEvent }

  if (event.linkText || event.linkUrl) {
    event.link = {
      text: event.linkText,
      url: event.linkUrl,
    }
  } else {
    event.link = null
  }

  delete event.linkText
  delete event.linkUrl

  return event
}

function transformEventToDb(oldEvent) {
  const event = { ...oldEvent }

  if (event.link) {
    event.linkText = event.link.text
    event.linkUrl = event.link.url
  } else if (event.link === null) {
    event.linkText = null
    event.linkUrl = null
  }
  delete event.link

  return event
}

function transformEventFromDbUserQuery(oldEvent) {
  const event = { ...oldEvent }
  if (event.cityName !== null) {
    event.city = {
      id: event.cityId,
      location: event.cityLocation.coordinates,
      radius: event.cityRadius,
      name: event.cityName,
      createdAt: event.cityCreatedAt,
      updatedAt: event.cityUpdatedAt,
      timeZone: event.cityTimeZone,
    }
  } else {
    event.city = null
  }
  delete event.cityId
  delete event.cityLocation
  delete event.cityRadius
  delete event.cityName
  delete event.cityCreatedAt
  delete event.cityUpdatedAt

  event.imageUrl = event.imageUrl || event.cityImageUrlFallback || config.app.events.imageUrlFallback
  delete event.cityImageUrlFallback

  if (event.linkText || event.linkUrl) {
    event.link = {
      text: event.linkText,
      url: event.linkUrl,
    }
  }
  delete event.linkText
  delete event.linkUrl

  return event
}


module.exports = {
  async getAll() {
    const result = await eventsForAdminsWithRPSV()
    return result.map(transformEventFromDb)
  },

  async getAllInCity(cityId) {
    const result = await eventsForAdminsWithRPSV()
    const eventsInCity = result.filter(event => event.cityId === cityId)
    // const eventsInCity = await eventsInCityForAdminsWithRPSV(cityId)
    return eventsInCity.map(transformEventFromDb)
  },

  async getById(eventId, options) {
    const foundEvent = await db.Event.findOne({ where: { id: eventId } })
    if (!foundEvent && options && options.allowNull) {
      return foundEvent
    }

    if (!foundEvent) {
      log.info(`Event with id ${eventId} was not found.`)
      throw new errors.NotFoundError('Target event was not found.')
    }

    return transformEventFromDb(foundEvent)
  },

  async register(event) {
    let referencedCity = null
    if (event.cityId !== null) {
      referencedCity = await db.City.findByPk(event.cityId)
      if (!referencedCity) {
        log.info(`City with id ${event.cityId} does not exist`)
        throw new errors.NotFoundError('Target city does not exist')
      }
    }

    if (isDateInPast(event.startDate)) {
      throw new errors.ValidationError(`Given date ${event.startDate} is in the past`)
    }

    if (event.startDate >= event.endDate) {
      throw new errors.ValidationError('Start date cannot be after the end date')
    }

    log.info(event, 'Event date before time shift')
    event = transformEventToDb(event, referencedCity)
    log.info(event, 'Event date after time shift')

    const foundEvent = await db.Event.findOne({ where: {
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      cityId: event.cityId,
    } })

    if (foundEvent) {
      log.info(`Event with the same
      name (${event.name}),
      startDate (${event.startDate}),
      endDate (${event.endDate}),
      cityId (${event.cityId}) already exists.`)
      throw new errors.ConflictError(`Event with the same
      name (${event.name}),
      startDate (${event.startDate}),
      endDate (${event.endDate}),
      ${event.cityId === null ? '' : `name (${referencedCity.name})`} already exists.`)
    }

    const imageUrl = event.imageUrl || (referencedCity && referencedCity.imageUrl) || config.app.events.imageUrlFallback

    const newEvent = await db.Event.create(event)
    if (event.cityId === null) {
      await notificationService.publishToTopic(config.aws.sns.generalTopicArn, newEvent, imageUrl)
    } else {
      await notificationService.publishToCity(newEvent, imageUrl, referencedCity)
    }

    return this.getAll()
  },

  async update(eventId, updateData) {
    const eventToBeUpdated = await db.Event.findByPk(eventId)

    if (!eventToBeUpdated) {
      log.info(`Event with id ${eventId} was not found.`)
      throw new errors.NotFoundError('Target event was not found.')
    }

    const newStartDate = updateData.startDate || eventToBeUpdated.startDate
    const newEndDate = updateData.endDate || eventToBeUpdated.endDate

    if (newStartDate >= newEndDate) {
      throw new errors.ValidationError('Start date cannot be after the end date')
    }

    if (updateData.date && isDateInPast(updateData.date)) {
      throw new errors.ValidationError(`Given date ${updateData.date} is in the past`)
    }

    let republish = false
    let referencedCity
    if (typeof updateData.cityId !== 'undefined') {
      if (updateData.cityId === eventToBeUpdated.cityId) {
        throw new errors.ValidationError(`City of the event is same as the received update value - ${updateData.cityId}`)
      }
      if (updateData.cityId !== null) {
        referencedCity = await db.City.findByPk(updateData.cityId)
        if (!referencedCity) {
          log.info(`City with id ${updateData.cityId} does not exist`)
          throw new errors.NotFoundError('Target city does not exist')
        }
      }
      republish = true
      updateData.publishedAt = new Date()
    } else if (eventToBeUpdated.cityId !== null) {
      referencedCity = await db.City.findByPk(eventToBeUpdated.cityId)
    }

    updateData = transformEventToDb(updateData, referencedCity)

    const nameAfterUpdate = updateData.name || eventToBeUpdated.name
    const startDateAfterUpdate = updateData.startDate || eventToBeUpdated.startDate
    const endDateAfterUpdate = updateData.endDate || eventToBeUpdated.endDate

    const duplicitEvent = await db.Event.findOne({ where: {
      name: nameAfterUpdate,
      startDate: startDateAfterUpdate,
      endDate: endDateAfterUpdate,
      cityId: eventToBeUpdated.cityId,
    } })

    if (duplicitEvent && duplicitEvent.id !== eventId) {
      log.info(`Cannot change the event, another one with the same same
        name (${nameAfterUpdate}),
        startDate (${startDateAfterUpdate}),
        endDate (${endDateAfterUpdate}),
        cityId (${eventToBeUpdated.cityId}) already exists.`)

      throw new errors.ConflictError(`Cannot change the event, another one with the same same
        name (${nameAfterUpdate}),
        startDate (${startDateAfterUpdate}),
        endDate (${endDateAfterUpdate}),
        cityId already exists.`)
    }


    const updateResult = await db.Event.update(updateData, { where: { id: eventId }, returning: true })
    if (updateResult[0] === 0) {
      log.info(`Event with id ${eventId} was not found.`)
      throw new errors.NotFoundError('Target event was not found.')
    }
    const updatedEvent = updateResult[1][0]
    if (republish) {
      const imageUrl = updatedEvent.imageUrl || (referencedCity && referencedCity.imageUrl) || config.app.events.imageUrlFallback

      if (updatedEvent.cityId === null) {
        await notificationService.publishToTopic(config.aws.sns.generalTopicArn, updatedEvent, imageUrl)
      } else {
        await notificationService.publishToCity(updatedEvent, imageUrl, referencedCity)
      }
    }

    return transformEventFromDb(updateResult[1][0])
  },

  async remove(eventId) {
    const existingEvent = await db.Event.findByPk(eventId)
    if (!existingEvent) {
      log.info(`Event with id ${eventId} was not found.`)
      throw new errors.NotFoundError('Target event does not exist')
    }

    try {
      await sequelize.transaction(async transaction => {
        await db.MessageInteraction.destroy({ where: { eventId }, transaction })
        await db.EventRegistration.destroy({ where: { eventId }, transaction })
        await db.Event.destroy({ where: { id: eventId }, transaction })
      })
    } catch (err) {
      throw new errors.InternalServerError('Failure executing DB transaction - deleting an Event/Event Registrations/Message Interactions')
    }

    return this.getAll()
  },

  async singleEventForUser(userId, eventId, changeToRead) {
    const dbResult = await singleEventForUser(userId, eventId)
    const transformedEventArray = dbResult.map(transformEventFromDbUserQuery)

    if (transformedEventArray.length === 0) {
      log.info(`Event with id ${eventId} either does not exist or the user ${userId} cannot see it`)
      throw new errors.NotFoundError('Cannot open the event - it has been deleted or it has already happened in the past.')
    }

    const requestedEvent = transformedEventArray[0]

    if (changeToRead && requestedEvent.messageState === 'new') {
      await messageStateService.interactWithMessage(userId, { eventId }, 'seen')
      requestedEvent.messageState = 'seen'
    }

    return requestedEvent
  },

  async upcomingEventsWithGoingStatus(userId) {
    const result = await eventsForUser(userId)
    return result.map(transformEventFromDbUserQuery)
  },
}
