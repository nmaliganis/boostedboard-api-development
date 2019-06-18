'use strict'

const _ = require('lodash')
const supertest = require('supertest')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()
const cityService = require('../../src/services/city-service')
const eventService = require('../../src/services/event-service')
const { resetDb } = require('../data/cleaner')
const { User } = require('../../src/database')
const crypt = require('../../src/utils/crypt')
const stubs = require('./sns-stub.spec')

function getDateshiftedByDays(days) {
  const today = new Date()
  today.setDate(today.getDate() + days)
  return today
}

const pragueData = {
  name: 'Prague',
  location: [14.42076, 50.08804],
}

const seoulData = {
  name: 'Seoul',
  location: [126.9780, 37.5665],
}

const globalEventData = {
  name: 'Event for everyone',
  description: 'Global event used for testing ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
  startDate: new Date().toISOString(),
  endDate: getDateshiftedByDays(1).toISOString(),
  location: 'AJOU Hwa-hong Hall',
  cityId: null,
  imageUrl: 'http://ktsocvjuf.js/xvq4',
  link: {
    text: 'Welcome to AJOU',
    url: 'https://www.ajou.ac.kr/en/international/inter07_01.jsp',
  },
}

function omitEventAttendanceNumbers(event) {
  return _.omit(event, ['attending', 'rejected', 'subscribed'])
}

async function registerCity(cityData) {
  return stringifyDates((await cityService.register(cityData)).find(city => city.name === cityData.name).get())
}

async function registerEvent(eventData) {
  const registeredEvent = omitEventAttendanceNumbers(stringifyDates((await eventService.register(eventData))
    .find(event => event.name === eventData.name)))
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
  delete registeredEvent.cityLocation
  delete registeredEvent.cityRadius
  delete registeredEvent.cityName
  delete registeredEvent.cityCreatedAt
  delete registeredEvent.cityUpdatedAt

  return registeredEvent
}

function stringifyDates(city) {
  return JSON.parse(JSON.stringify(city))
}

const pushTokenData = {
  token: 'ABCD',
  deviceId: 'DEV1',
}

const pushTokenData2 = {
  token: 'ABCDE',
  deviceId: 'DEV2',
}

describe('Endpoints: /inbox/message-interaction', () => {
  let user1
  let user2

  beforeEach(async () => {
    await resetDb()

    user1 = await User.create({ ...generate.user() })
    user1.token = await crypt.generateAccessToken(user1.id)

    user2 = await User.create({ ...generate.user() })
    user2.token = await crypt.generateAccessToken(user2.id)

    await registerCity(pragueData)
    await registerCity(seoulData)
  })


  describe('Push notifications', () => {
    it('Calls SNS and stores subscription ARNs', async () => {
      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', user1.token)
        .send(pushTokenData)
        .expect(204)

      expect(stubs.createPlatformEndpointStub.callCount).to.be.equal(1)
      expect(stubs.subscribeStub.callCount).to.be.equal(1)

      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', user1.token)
        .send(pushTokenData2)
        .expect(204)

      expect(stubs.createPlatformEndpointStub.callCount).to.be.equal(2)
      expect(stubs.subscribeStub.callCount).to.be.equal(2)
    })

    it('Sends push notification when a global event is created', async () => {
      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', user1.token)
        .send(pushTokenData)
        .expect(204)

      stringifyDates(await registerEvent(globalEventData))

      expect(stubs.publishStub.callCount).to.be.equal(1)
    })
  })
})
