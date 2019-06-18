'use strict'

const _ = require('lodash')
const supertest = require('supertest')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()
const cityService = require('../../src/services/city-service')
const eventService = require('../../src/services/event-service')
const citySubscriptionService = require('../../src/services/city-subscription-service')
const eventRegistrationService = require('../../src/services/event-registration-service')
const messageStateService = require('../../src/services/message-state-service')
const { resetDb } = require('../data/cleaner')
const { User } = require('../../src/database')
const crypt = require('../../src/utils/crypt')
const config = require('../../src/config')

const pragueData = {
  name: 'Prague',
  location: [14.42076, 50.08804],
}

const seoulData = {
  name: 'Seoul',
  location: [126.9780, 37.5665],
}

function getDateshiftedByDays(days) {
  const today = new Date()
  today.setDate(today.getDate() + days)
  return today
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

const event3Data = {
  name: 'Third Event',
  description: 'Whoala loopolala OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
  startDate: new Date().toISOString(),
  endDate: getDateshiftedByDays(1).toISOString(),
  location: 'Prague castle',
  cityId: 2,
  imageUrl: 'http://psdfons.om/gp',
  link: {
    text: 'Castle tour',
    url: 'https://www.pragueticketoffice.com/prostoradetail.aspx?id=prague-castle&gclid=CjwKCAjwqLblBRBYEiwAV3pCJvSEBEJdthCIpt6JIMdNOIKpEHcyEGPKVP_7fdx9UsyukBQGZ49_mRoCA1IQAvD_BwE',
  },
}

const olderEventData = {
  name: 'Old event',
  description: 'This event should not be shown RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  startDate: getDateshiftedByDays(-3).toISOString(),
  endDate: getDateshiftedByDays(-2).toISOString(),
  location: '나즈드라비 체코 팝',
  cityId: 3,
  imageUrl: 'http://xepxxs.qp/aue',
  link: {
    text: 'Gangnam',
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
  },
}

function omitEventAttendanceNumbers(event) {
  return _.omit(event, ['attending', 'rejected', 'subscribed'])
}

function omitTimeZone(event) {
  return _.omit(event, ['city.timeZone'])
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

describe('Endpoints: /events/', () => {
  let user1
  let user2

  let prague
  let seoul

  let event1
  let event2
  let olderEvent

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
    olderEvent = stringifyDates(await registerEvent(olderEventData))
  })

  describe('GET /events', () => {
    it('Should show no events when user is subscribed to no city', async () => {
      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(0)
    })

    it('Should show 1 event in subscribed city', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(1)
      expect(omitTimeZone(response.body.events[0])).to.deep.include(event2)
      expect(response.body.events[0].going).to.be.equal(null)
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should show 1 attending event in subscribed city', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await eventRegistrationService.register(user1.id, event1.id, true)

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(1)
      expect(omitTimeZone(response.body.events[0])).to.deep.include(event1)
      expect(response.body.events[0].going).to.be.equal(true)
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should show 1 rejected event in subscribed city', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await eventRegistrationService.register(user1.id, event1.id, false)

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(1)
      expect(omitTimeZone(response.body.events[0])).to.deep.include(event1)
      expect(response.body.events[0].going).to.be.equal(false)
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should show 1 attending event in unsubscribed city', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await eventRegistrationService.register(user1.id, event1.id, true)
      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(1)
      expect(omitTimeZone(response.body.events[0])).to.deep.include(event1)
      expect(response.body.events[0].going).to.be.equal(true)
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should show 1 rejected event in unsubscribed city', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await eventRegistrationService.register(user1.id, event1.id, false)
      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(1)
      expect(omitTimeZone(response.body.events[0])).to.deep.include(event1)
      expect(response.body.events[0].going).to.be.equal(false)
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should show no events when subscription to city has been deleted', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(0)
    })

    it('Should show global event', async () => {
      const globalEvent = await registerEvent({ ...event2Data, cityId: null, name: 'global event' })

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(1)
      expect(response.body.events[0]).to.deep.include(globalEvent)
      expect(response.body.events[0].going).to.be.equal(null)
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should show global event when attending', async () => {
      const globalEvent = await registerEvent({ ...event2Data, cityId: null, name: 'global event' })
      await eventRegistrationService.register(user1.id, globalEvent.id, true)

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(1)
      expect(response.body.events[0]).to.deep.include(globalEvent)
      expect(response.body.events[0].going).to.be.equal(true)
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should show global event for when rejected', async () => {
      const globalEvent = await registerEvent({ ...event2Data, cityId: null, name: 'global event' })
      await eventRegistrationService.register(user1.id, globalEvent.id, false)

      const response = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(1)
      expect(response.body.events[0]).to.deep.include(globalEvent)
      expect(response.body.events[0].going).to.be.equal(false)
      expect(response.body.events[0].messageState).to.be.equal('new')
    })

    it('Should show 1 event after changing attendance', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await eventRegistrationService.register(user1.id, event1.id, true)

      const responseWhenGoing = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseWhenGoing.body).to.have.all.keys(['events'])
      expect(responseWhenGoing.body.events).to.be.an('array')
      expect(responseWhenGoing.body.events).to.be.length(1)
      expect(omitTimeZone(responseWhenGoing.body.events[0])).to.deep.include(event1)
      expect(responseWhenGoing.body.events[0].going).to.be.equal(true)
      expect(responseWhenGoing.body.events[0].messageState).to.be.equal('new')

      await eventRegistrationService.register(user1.id, event1.id, false)

      const responseAfterRejecting = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseAfterRejecting.body).to.have.all.keys(['events'])
      expect(responseAfterRejecting.body.events).to.be.an('array')
      expect(responseAfterRejecting.body.events).to.be.length(1)
      expect(omitTimeZone(responseAfterRejecting.body.events[0])).to.deep.include(event1)
      expect(responseAfterRejecting.body.events[0].going).to.be.equal(false)
      expect(responseAfterRejecting.body.events[0].messageState).to.be.equal('new')
    })

    it('Should not show an old event', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await eventRegistrationService.register(user1.id, olderEvent.id, true)

      const responseWhenGoing = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseWhenGoing.body).to.have.all.keys(['events'])
      expect(responseWhenGoing.body.events).to.be.an('array')
      expect(responseWhenGoing.body.events).to.be.length(1)
      expect(omitTimeZone(responseWhenGoing.body.events[0])).to.deep.include(event2)
      expect(responseWhenGoing.body.events[0].going).to.be.equal(null)
      expect(responseWhenGoing.body.events[0].messageState).to.be.equal('new')

      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, seoul.id)

      const responseAfterRejecting = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseAfterRejecting.body).to.have.all.keys(['events'])
      expect(responseAfterRejecting.body.events).to.be.an('array')
      expect(responseAfterRejecting.body.events).to.be.length(0)
    })

    it('Should not show events someone else should see', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await eventRegistrationService.register(user1.id, olderEvent.id, true)

      const responseFirstUser = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseFirstUser.body).to.have.all.keys(['events'])
      expect(responseFirstUser.body.events).to.be.an('array')
      expect(responseFirstUser.body.events).to.be.length(1)
      expect(omitTimeZone(responseFirstUser.body.events[0])).to.deep.include(event2)
      expect(responseFirstUser.body.events[0].going).to.be.equal(null)
      expect(responseFirstUser.body.events[0].messageState).to.be.equal('new')

      const responseSecondUser = await supertest(app)
        .get('/events')
        .set('Authorization', user2.token)
        .expect(200)

      expect(responseSecondUser.body).to.have.all.keys(['events'])
      expect(responseSecondUser.body.events).to.be.an('array')
      expect(responseSecondUser.body.events).to.be.length(0)

      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, seoul.id)

      const responseFirstUserAfterSwitch = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseFirstUserAfterSwitch.body).to.have.all.keys(['events'])
      expect(responseFirstUserAfterSwitch.body.events).to.be.an('array')
      expect(responseFirstUserAfterSwitch.body.events).to.be.length(0)

      const responseSecondUserAfterSwitch = await supertest(app)
        .get('/events')
        .set('Authorization', user2.token)
        .expect(200)

      expect(responseSecondUserAfterSwitch.body).to.have.all.keys(['events'])
      expect(responseSecondUserAfterSwitch.body.events).to.be.an('array')
      expect(responseSecondUserAfterSwitch.body.events).to.be.length(1)
      expect(omitTimeZone(responseSecondUserAfterSwitch.body.events[0])).to.deep.include(event2)
      expect(responseSecondUserAfterSwitch.body.events[0].going).to.be.equal(null)
      expect(responseSecondUserAfterSwitch.body.events[0].messageState).to.be.equal('new')
    })

    it('Event has its own image URL, not the one from a city', async () => {
      const cityWithImageUrlData = {
        name: 'Lugano',
        location: [8.9511, 46.0037],
        imageUrl: 'http://xbasd.im/babal',
      }

      const cityWithImageUrl = await registerCity(cityWithImageUrlData)

      const eventWithImageUrlData = {
        name: 'Event with URL',
        description: 'This test should use its own URL',
        startDate: new Date().toISOString(),
        endDate: getDateshiftedByDays(1).toISOString(),
        location: 'Reddit',
        cityId: cityWithImageUrl.id,
        imageUrl: 'http://fmoenb.px/xrnn',
        link: {
          text: 'Click HERE!!',
          url: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
        },
      }

      const eventWithImageUrl = await registerEvent(eventWithImageUrlData)

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, cityWithImageUrl.id)
      await eventRegistrationService.register(user1.id, eventWithImageUrl.id, true)

      const responseFirstUser = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseFirstUser.body).to.have.all.keys(['events'])
      expect(responseFirstUser.body.events).to.be.an('array')
      expect(responseFirstUser.body.events).to.be.length(1)
      expect(responseFirstUser.body.events[0].imageUrl).to.be.equal(eventWithImageUrlData.imageUrl)
    })

    it('Event has image URL from city as a fallback', async () => {
      const cityWithImageUrlData = {
        name: 'Lugano',
        location: [8.9511, 46.0037],
        imageUrl: 'http://jioookj.la/rofl',
      }

      const cityWithImageUrl = await registerCity(cityWithImageUrlData)

      const eventWithoutImageUrlData = {
        name: 'Event without URL',
        description: 'This test should have URL from a city',
        startDate: new Date().toISOString(),
        endDate: getDateshiftedByDays(1).toISOString(),
        location: 'Reddit',
        cityId: cityWithImageUrl.id,
        link: {
          text: 'Click HERE!!',
          url: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
        },
      }

      const eventWithoutImageUrl = await registerEvent(eventWithoutImageUrlData)

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, cityWithImageUrl.id)
      await eventRegistrationService.register(user1.id, eventWithoutImageUrl.id, true)

      const responseFirstUser = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseFirstUser.body).to.have.all.keys(['events'])
      expect(responseFirstUser.body.events).to.be.an('array')
      expect(responseFirstUser.body.events).to.be.length(1)
      expect(responseFirstUser.body.events[0].imageUrl).to.be.equal(cityWithImageUrlData.imageUrl)
    })

    it('Event has image URL from a global fallback', async () => {
      const cityWithoutImageUrlData = {
        name: 'Lugano',
        location: [8.9511, 46.0037],
      }

      const cityWithoutImageUrl = await registerCity(cityWithoutImageUrlData)

      const eventWithoutImageUrlData = {
        name: 'Event without URL',
        description: 'This test should have URL from a city',
        startDate: new Date().toISOString(),
        endDate: getDateshiftedByDays(1).toISOString(),
        location: 'Reddit',
        cityId: cityWithoutImageUrl.id,
        link: {
          text: 'Click HERE!!',
          url: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
        },
      }

      const eventWithoutImageUrl = await registerEvent(eventWithoutImageUrlData)

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, cityWithoutImageUrl.id)
      await eventRegistrationService.register(user1.id, eventWithoutImageUrl.id, true)

      const responseFirstUser = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseFirstUser.body).to.have.all.keys(['events'])
      expect(responseFirstUser.body.events).to.be.an('array')
      expect(responseFirstUser.body.events).to.be.length(1)
      expect(responseFirstUser.body.events[0].imageUrl).to.be.equal(config.app.events.imageUrlFallback)
    })

    it('Events are ordered by publish date', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)

      const firstResponse = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(firstResponse.body).to.have.all.keys(['events'])
      expect(firstResponse.body.events).to.be.an('array')
      expect(firstResponse.body.events).to.be.length(2)
      expect(firstResponse.body.events.map(event => event.id)).to.be.deep.equal([event2.id, event1.id])

      await eventService.update(event1.id, { cityId: seoul.id })

      const secondResponse = await supertest(app)
        .get('/events')
        .set('Authorization', user1.token)
        .expect(200)

      expect(secondResponse.body).to.have.all.keys(['events'])
      expect(secondResponse.body.events).to.be.an('array')
      expect(secondResponse.body.events).to.be.length(2)
      expect(secondResponse.body.events.map(event => event.id)).to.be.deep.equal([event1.id, event2.id])
    })
  })
})

describe('Endpoints: /events/registrations', () => {
  let user1
  let user2

  let prague

  let event1

  beforeEach(async () => {
    await resetDb()

    user1 = await User.create({ ...generate.user() })
    user1.token = await crypt.generateAccessToken(user1.id)

    user2 = await User.create({ ...generate.user() })
    user2.token = await crypt.generateAccessToken(user2.id)

    prague = await registerCity(pragueData)

    event1 = stringifyDates(await registerEvent(event1Data))
  })

  describe('POST /events/registrations', () => {
    it('returns 201', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await supertest(app)
        .post('/events/registrations')
        .send({ going: true, eventId: event1.id })
        .set('Authorization', user1.token)
        .expect(201)
    })

    it('Registration to an event change what then user sees in the event list', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      const eventsBeforeRegistration = stringifyDates(await eventService.upcomingEventsWithGoingStatus(user1.id))

      expect(eventsBeforeRegistration).to.be.an('array')
      expect(eventsBeforeRegistration).to.be.length(1)
      expect(omitTimeZone(eventsBeforeRegistration[0])).to.deep.include(event1)
      expect(eventsBeforeRegistration[0].going).to.equal(null)

      const registrationResponse = await supertest(app)
        .post('/events/registrations')
        .send({ going: true, eventId: event1.id })
        .set('Authorization', user1.token)
        .expect(201)

      expect(registrationResponse.body).to.have.all.keys(['registeredEvent'])
      expect(registrationResponse.body.registeredEvent).to.be.an('object')
      expect(omitTimeZone(registrationResponse.body.registeredEvent)).to.deep.include(event1)
      expect(registrationResponse.body.registeredEvent.going).to.equal(true)

      const eventsAfterRegistration = stringifyDates(await eventService.upcomingEventsWithGoingStatus(user1.id))
      expect(eventsAfterRegistration).to.be.an('array')
      expect(eventsAfterRegistration).to.be.length(1)
      expect(omitTimeZone(eventsAfterRegistration[0])).to.deep.include(event1)
      expect(eventsAfterRegistration[0].going).to.equal(true)

      const deRegistrationResponse = await supertest(app)
        .post('/events/registrations')
        .send({ going: false, eventId: event1.id })
        .set('Authorization', user1.token)
        .expect(201)

      expect(deRegistrationResponse.body).to.have.all.keys(['registeredEvent'])
      expect(deRegistrationResponse.body.registeredEvent).to.be.an('object')
      expect(omitTimeZone(deRegistrationResponse.body.registeredEvent)).to.deep.include(event1)
      expect(deRegistrationResponse.body.registeredEvent.going).to.equal(false)

      const eventsAfterDeregistration = stringifyDates(await eventService.upcomingEventsWithGoingStatus(user1.id))
      expect(eventsAfterDeregistration).to.be.an('array')
      expect(eventsAfterDeregistration).to.be.length(1)
      expect(omitTimeZone(eventsAfterDeregistration[0])).to.deep.include(event1)
      expect(eventsAfterDeregistration[0].going).to.equal(false)
    })

    it('Cannot register to an even in not subscribed citey', async () => {
      await supertest(app)
        .post('/events/registrations')
        .send({ going: true, eventId: event1.id })
        .set('Authorization', user1.token)
        .expect(404)
    })

    it('Cannot see events of a city after unsubscribing', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      const eventsAfterSubscription = stringifyDates(await eventService.upcomingEventsWithGoingStatus(user1.id))

      expect(eventsAfterSubscription).to.be.an('array')
      expect(eventsAfterSubscription).to.be.length(1)
      expect(omitTimeZone(eventsAfterSubscription[0])).to.deep.include(event1)
      expect(eventsAfterSubscription[0].going).to.equal(null)

      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)

      const eventsAfterUnsubscription = stringifyDates(await eventService.upcomingEventsWithGoingStatus(user1.id))

      expect(eventsAfterUnsubscription).to.be.an('array')
      expect(eventsAfterUnsubscription).to.be.length(0)
    })

    it('Can see event after unsubscribing when attending', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)

      const registrationResponse = await supertest(app)
        .post('/events/registrations')
        .send({ going: true, eventId: event1.id })
        .set('Authorization', user1.token)
        .expect(201)

      expect(registrationResponse.body).to.have.all.keys(['registeredEvent'])
      expect(registrationResponse.body.registeredEvent).to.be.an('object')
      expect(omitTimeZone(registrationResponse.body.registeredEvent)).to.deep.include(event1)
      expect(registrationResponse.body.registeredEvent.going).to.equal(true)

      const eventsAfterRegistration = stringifyDates(await eventService.upcomingEventsWithGoingStatus(user1.id))
      expect(eventsAfterRegistration).to.be.an('array')
      expect(eventsAfterRegistration).to.be.length(1)
      expect(omitTimeZone(eventsAfterRegistration[0])).to.deep.include(event1)
      expect(eventsAfterRegistration[0].going).to.equal(true)

      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)

      const eventsAfterUnsubscribe = stringifyDates(await eventService.upcomingEventsWithGoingStatus(user1.id))

      expect(eventsAfterUnsubscribe).to.be.an('array')
      expect(eventsAfterUnsubscribe).to.be.length(1)
      expect(omitTimeZone(eventsAfterUnsubscribe[0])).to.deep.include(event1)
      expect(eventsAfterUnsubscribe[0].going).to.equal(true)
    })
  })
})

describe('Endpoints: /events/{eventId}', () => {
  let user1
  let user2

  let prague
  let seoul

  let event1
  let event2
  let event3

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
    event3 = stringifyDates(await registerEvent(event3Data))
    stringifyDates(await registerEvent(olderEventData))
  })

  describe('GET /events/{eventId}', () => {
    it('returns a single event', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)

      const response = await supertest(app)
        .get(`/events/${event1.id}`)
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body).to.be.an('object')
      expect(omitTimeZone(response.body)).to.deep.include(event1)
      expect(response.body.going).to.be.equal(null)
      expect(response.body.messageState).to.be.equal('new')
    })

    it('When query read parameter is set to false the event status is not changed', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await messageStateService.interactWithMessage(user1.id, { eventId: event2.id }, 'seen')
      await messageStateService.interactWithMessage(user1.id, { eventId: event3.id }, 'deleted')

      const response1 = await supertest(app)
        .get(`/events/${event1.id}?read=false`)
        .set('Authorization', user1.token)
        .expect(200)

      expect(response1.body).to.be.an('object')
      expect(omitTimeZone(response1.body)).to.deep.include(event1)
      expect(response1.body.going).to.be.equal(null)
      expect(response1.body.messageState).to.be.equal('new')

      const response2 = await supertest(app)
        .get(`/events/${event2.id}?read=false`)
        .set('Authorization', user1.token)
        .expect(200)

      expect(response2.body).to.be.an('object')
      expect(omitTimeZone(response2.body)).to.deep.include(event2)
      expect(response2.body.going).to.be.equal(null)
      expect(response2.body.messageState).to.be.equal('seen')

      const response3 = await supertest(app)
        .get(`/events/${event3.id}?read=false`)
        .set('Authorization', user1.token)
        .expect(200)

      expect(response3.body).to.be.an('object')
      expect(omitTimeZone(response3.body)).to.deep.include(event3)
      expect(response3.body.going).to.be.equal(null)
      expect(response3.body.messageState).to.be.equal('deleted')
    })

    it('When the query parameter read is set to true the event state changes to read', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await messageStateService.interactWithMessage(user1.id, { eventId: event2.id }, 'seen')
      await messageStateService.interactWithMessage(user1.id, { eventId: event3.id }, 'deleted')

      const response1 = await supertest(app)
        .get(`/events/${event1.id}?read=true`)
        .set('Authorization', user1.token)
        .expect(200)

      expect(response1.body).to.be.an('object')
      expect(omitTimeZone(response1.body)).to.deep.include(event1)
      expect(response1.body.going).to.be.equal(null)
      expect(response1.body.messageState).to.be.equal('seen')

      const response2 = await supertest(app)
        .get(`/events/${event2.id}?read=true`)
        .set('Authorization', user1.token)
        .expect(200)

      expect(response2.body).to.be.an('object')
      expect(omitTimeZone(response2.body)).to.deep.include(event2)
      expect(response2.body.going).to.be.equal(null)
      expect(response2.body.messageState).to.be.equal('seen')

      const response3 = await supertest(app)
        .get(`/events/${event3.id}?read=true`)
        .set('Authorization', user1.token)
        .expect(200)

      expect(response3.body).to.be.an('object')
      expect(omitTimeZone(response3.body)).to.deep.include(event3)
      expect(response3.body.going).to.be.equal(null)
      expect(response3.body.messageState).to.be.equal('deleted')
    })

    it('returns 404 if user is not subscribed in the city of an event', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)

      await supertest(app)
        .get(`/events/${event1.id}`)
        .set('Authorization', user1.token)
        .expect(404)
    })

    it('returns 404 if event does not exist', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)

      await supertest(app)
        .get('/events/12345')
        .set('Authorization', user1.token)
        .expect(404)
    })
  })
})
