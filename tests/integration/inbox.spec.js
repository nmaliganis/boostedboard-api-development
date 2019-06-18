'use strict'

const _ = require('lodash')
const supertest = require('supertest')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()
const cityService = require('../../src/services/city-service')
const eventService = require('../../src/services/event-service')
const citySubscriptionService = require('../../src/services/city-subscription-service')
const { resetDb } = require('../data/cleaner')
const { User } = require('../../src/database')
const crypt = require('../../src/utils/crypt')

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

const event1Data = {
  name: 'First Event',
  description: 'Event used for testing. XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  startDate: new Date().toISOString(),
  endDate: getDateshiftedByDays(1).toISOString(),
  location: 'STRV Prague scroll bar',
  cityId: 2,
  imageUrl: 'http://jvgenbk.xl/obfg',
  link: {
    text: 'Check it out',
    url: 'https://s3-media3.fl.yelpcdn.com/bphoto/buXPorfsYjxAf_wOAdAUGA/o.jpg',
  },
}

const event2Data = {
  name: 'Second Event',
  description: 'Event used for another testing YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  startDate: new Date().toISOString(),
  endDate: getDateshiftedByDays(1).toISOString(),
  location: 'Deongdemun Design Plaza',
  cityId: 3,
  imageUrl: 'http://pppkons.ig/xip',
  link: {
    text: 'Exhibition',
    url: 'http://english.visitseoul.net/attractions/Dongdaemun-Design-Plaza-DDP_/96',
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

describe('Endpoints: /inbox/message-interaction', () => {
  let user1
  let user2

  let prague
  let seoul

  let event1
  let event2


  beforeEach(async () => {
    await resetDb()

    user1 = await User.create({ ...generate.user() })
    user1.token = await crypt.generateAccessToken(user1.id)

    user2 = await User.create({ ...generate.user() })
    user2.token = await crypt.generateAccessToken(user2.id)

    prague = await registerCity(pragueData)
    seoul = await registerCity(seoulData)

    event1 = stringifyDates(await registerEvent(event1Data))
    event2 = stringifyDates(await registerEvent(event2Data))
  })

  describe('POST /inbox/message-interaction', () => {
    it('Event messages in inbox are not read by default', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      const events = await eventService.upcomingEventsWithGoingStatus(user1.id)

      expect(events).to.be.an('array')
      expect(events).to.be.length(2)
      expect(events[0].messageState).to.be.equal('new')
      expect(events[1].messageState).to.be.equal('new')
    })

    it('Should mark message as read after calling /inbox/message-interaction', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      const firstResponse = await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'seen' })
        .set('Authorization', user1.token)
        .expect(201)

      expect(firstResponse.body).to.have.all.keys(['events', 'marketingMessages'])
      expect(firstResponse.body.events).to.be.an('array')
      expect(firstResponse.body.events).to.be.length(2)
      expect(firstResponse.body.events[1].messageState).to.be.equal('seen')
      expect(firstResponse.body.events[0].messageState).to.be.equal('new')

      const secondResponse = await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event2.id }, messageState: 'seen' })
        .set('Authorization', user1.token)
        .expect(201)

      expect(secondResponse.body).to.have.all.keys(['events', 'marketingMessages'])
      expect(secondResponse.body.events).to.be.an('array')
      expect(secondResponse.body.events).to.be.length(2)
      expect(secondResponse.body.events[0].messageState).to.be.equal('seen')
      expect(secondResponse.body.events[1].messageState).to.be.equal('seen')
    })

    it('Should allow to mark message as read twice', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'seen' })
        .set('Authorization', user1.token)
        .expect(201)

      await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'seen' })
        .set('Authorization', user1.token)
        .expect(201)
    })

    it('Cannot mark read message for not existing event', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: 1246234 }, messageState: 'seen' })
        .set('Authorization', user1.token)
        .expect(404)
    })

    it('Should mark message as deleted and not show it', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      const response = await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'deleted' })
        .set('Authorization', user1.token)
        .expect(201)

      expect(response.body).to.have.all.keys(['events', 'marketingMessages'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(2)
      expect(response.body.events[1].messageState).to.be.equal('deleted')
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should mark message as deleted and then as read', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      const firstResponse = await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'deleted' })
        .set('Authorization', user1.token)
        .expect(201)

      expect(firstResponse.body).to.have.all.keys(['events', 'marketingMessages'])
      expect(firstResponse.body.events).to.be.an('array')
      expect(firstResponse.body.events).to.be.length(2)
      expect(firstResponse.body.events[1].messageState).to.be.equal('deleted')
      expect(firstResponse.body.events[0].messageState).to.be.equal('new')

      const secondResponse = await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'seen' })
        .set('Authorization', user1.token)
        .expect(201)

      expect(secondResponse.body).to.have.all.keys(['events', 'marketingMessages'])
      expect(secondResponse.body.events).to.be.an('array')
      expect(secondResponse.body.events).to.be.length(2)
      expect(secondResponse.body.events[1].messageState).to.be.equal('seen')
      expect(secondResponse.body.events[0].messageState).to.be.equal('new')
    })

    it('Should mark message read and then deleted', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      const firstResponse = await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'seen' })
        .set('Authorization', user1.token)
        .expect(201)

      expect(firstResponse.body).to.have.all.keys(['events', 'marketingMessages'])
      expect(firstResponse.body.events).to.be.an('array')
      expect(firstResponse.body.events).to.be.length(2)
      expect(firstResponse.body.events[1].messageState).to.be.equal('seen')
      expect(firstResponse.body.events[0].messageState).to.be.equal('new')

      const secondResponse = await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'deleted' })
        .set('Authorization', user1.token)
        .expect(201)

      expect(secondResponse.body).to.have.all.keys(['events', 'marketingMessages'])
      expect(secondResponse.body.events).to.be.an('array')
      expect(secondResponse.body.events).to.be.length(2)
      expect(secondResponse.body.events[1].messageState).to.be.equal('deleted')
      expect(secondResponse.body.events[0].messageState).to.be.equal('new')
    })

    it('Should allow to delete same message twice', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'deleted' })
        .set('Authorization', user1.token)
        .expect(201)

      await supertest(app)
        .post('/inbox/message-interaction')
        .send({ messageId: { eventId: event1.id }, messageState: 'deleted' })
        .set('Authorization', user1.token)
        .expect(201)
    })
  })
})
