'use strict'

const _ = require('lodash')
const cityService = require('../../src/services/city-service')
const eventService = require('../../src/services/event-service')
const citySubscriptionService = require('../../src/services/city-subscription-service')

function stringifyDates(city) {
  return JSON.parse(JSON.stringify(city))
}

function omitEventAttendanceNumbers(event) {
  return _.omit(event, ['attending', 'rejected', 'subscribed'])
}

function omitStartAndEndDate(event) {
  return _.omit(event, ['startDate', 'endDate'])
}

async function registerCity(cityData) {
  return stringifyDates((await cityService.register(cityData)).find(city => city.name === cityData.name).get())
}

async function registerEvent(eventData, options) {
  const registeredEvent = omitEventAttendanceNumbers(stringifyDates((await eventService.register(eventData))
    .find(event => event.name === eventData.name)))
  if (options && options.includeCity) {
    if (registeredEvent.cityId !== null) {
      const eventCity = await cityService.getById(registeredEvent.cityId)
      registeredEvent.city = {
        id: eventCity.id,
        location: eventCity.location,
        radius: eventCity.radius,
        name: eventCity.name,
        createdAt: eventCity.createdAt,
        updatedAt: eventCity.updatedAt,
      }
    } else {
      registeredEvent.city = null
    }

    delete registeredEvent.cityId
  }

  delete registeredEvent.cityLocation
  delete registeredEvent.cityRadius
  delete registeredEvent.cityName
  delete registeredEvent.cityCreatedAt
  delete registeredEvent.cityUpdatedAt

  return registeredEvent
}

function getSummaryObject(attending, rejected, subscribed) {
  return { attending, rejected, subscribed }
}

function filterSummaries(body) {
  return getSummaryObject(body.attending, body.rejected, body.subscribed)
}

async function subscribedCitiesForUser(userId) {
  return stringifyDates((await citySubscriptionService.getSubscribedCities(userId)).map(sub => sub.get()))
}

module.exports = {
  stringifyDates,
  omitEventAttendanceNumbers,
  omitStartAndEndDate,
  registerCity,
  registerEvent,
  getSummaryObject,
  filterSummaries,
  subscribedCitiesForUser,
}

