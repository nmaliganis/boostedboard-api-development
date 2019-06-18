'use strict'

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const { resetDb } = require('../../../data/cleaner')
const app = require('../../../../src/app').callback()
const { User } = require('../../../../src/database')
const generate = require('../../../data/generate')
const crypt = require('../../../../src/utils/crypt')
const citySubscriptionService = require('../../../../src/services/city-subscription-service')
const eventRegistrationService = require('../../../../src/services/event-registration-service')
const helpers = require('../../../helpers/events')
const exampleData = require('../../../data/examples')


describe('Endpoints: /admin/events', () => {
  let admin
  let user1
  let user2

  let prague
  let seoul

  beforeEach(async () => {
    await resetDb()

    admin = await User.create({ ...generate.user(), role: 'admin' })
    admin.token = await crypt.generateAccessToken(admin.id)

    user1 = await User.create({ ...generate.user() })
    user1.token = await crypt.generateAccessToken(user1.id)

    user2 = await User.create({ ...generate.user() })
    user2.token = await crypt.generateAccessToken(user2.id)

    prague = await helpers.registerCity(exampleData.pragueData)
    seoul = await helpers.registerCity(exampleData.seoulData)
  })

  describe('GET /admin/events - summaries only', () => {
    it('Should get no attendies, rejects or subscribers', async () => {
      const firstEvent = await helpers.registerEvent(generate.event(prague.id))
      const secondEvent = await helpers.registerEvent(generate.event(prague.id))

      const eventsResponse = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(eventsResponse.body).to.have.all.keys(['events'])
      expect(eventsResponse.body.events).to.be.an('array')
      expect(eventsResponse.body.events).to.be.length(2)

      expect(eventsResponse.body.events[1].id).to.be.equal(firstEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[1])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))

      expect(eventsResponse.body.events[0].id).to.be.equal(secondEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[0])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))
    })

    it('Should show only subscribers in one city', async () => {
      const firstEvent = await helpers.registerEvent(generate.event(prague.id))
      const secondEvent = await helpers.registerEvent(generate.event(seoul.id))

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, prague.id)

      const eventsResponse = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(eventsResponse.body).to.have.all.keys(['events'])
      expect(eventsResponse.body.events).to.be.an('array')
      expect(eventsResponse.body.events).to.be.length(2)

      expect(eventsResponse.body.events[1].id).to.be.equal(firstEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[1])).to.deep.equal(helpers.getSummaryObject(0, 0, 2))

      expect(eventsResponse.body.events[0].id).to.be.equal(secondEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[0])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))
    })

    it('Should show accepted attendance in one city', async () => {
      const firstEvent = await helpers.registerEvent(generate.event(prague.id))
      const secondEvent = await helpers.registerEvent(generate.event(seoul.id))

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, prague.id)

      await eventRegistrationService.register(user1.id, firstEvent.id, false)
      await eventRegistrationService.register(user1.id, firstEvent.id, true)
      await eventRegistrationService.register(user2.id, firstEvent.id, true)

      const eventsResponse = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(eventsResponse.body).to.have.all.keys(['events'])
      expect(eventsResponse.body.events).to.be.an('array')
      expect(eventsResponse.body.events).to.be.length(2)

      expect(eventsResponse.body.events[1].id).to.be.equal(firstEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[1])).to.deep.equal(helpers.getSummaryObject(2, 0, 2))

      expect(eventsResponse.body.events[0].id).to.be.equal(secondEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[0])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))
    })

    it('Should show rejected attendance in one city', async () => {
      const firstEvent = await helpers.registerEvent(generate.event(prague.id))
      const secondEvent = await helpers.registerEvent(generate.event(seoul.id))

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, prague.id)

      await eventRegistrationService.register(user1.id, firstEvent.id, true)
      await eventRegistrationService.register(user1.id, firstEvent.id, false)
      await eventRegistrationService.register(user2.id, firstEvent.id, false)

      const eventsResponse = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(eventsResponse.body).to.have.all.keys(['events'])
      expect(eventsResponse.body.events).to.be.an('array')
      expect(eventsResponse.body.events).to.be.length(2)

      expect(eventsResponse.body.events[1].id).to.be.equal(firstEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[1])).to.deep.equal(helpers.getSummaryObject(0, 2, 2))

      expect(eventsResponse.body.events[0].id).to.be.equal(secondEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[0])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))
    })

    it('Should show nothing if users unsubscribe from city', async () => {
      const firstEvent = await helpers.registerEvent(generate.event(prague.id))
      const secondEvent = await helpers.registerEvent(generate.event(seoul.id))

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, prague.id)

      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)
      await citySubscriptionService.unsubscribeUserFromCityEvents(user2.id, prague.id)

      const eventsResponse = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(eventsResponse.body).to.have.all.keys(['events'])
      expect(eventsResponse.body.events).to.be.an('array')
      expect(eventsResponse.body.events).to.be.length(2)

      expect(eventsResponse.body.events[1].id).to.be.equal(firstEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[1])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))

      expect(eventsResponse.body.events[0].id).to.be.equal(secondEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[0])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))
    })

    it('Should show also rejects of people who unsubscribed', async () => {
      const firstEvent = await helpers.registerEvent(generate.event(prague.id))
      const secondEvent = await helpers.registerEvent(generate.event(seoul.id))

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, prague.id)

      await eventRegistrationService.register(user1.id, firstEvent.id, false)
      await eventRegistrationService.register(user2.id, firstEvent.id, false)

      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)
      await citySubscriptionService.unsubscribeUserFromCityEvents(user2.id, prague.id)

      const eventsResponse = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(eventsResponse.body).to.have.all.keys(['events'])
      expect(eventsResponse.body.events).to.be.an('array')
      expect(eventsResponse.body.events).to.be.length(2)

      expect(eventsResponse.body.events[1].id).to.be.equal(firstEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[1])).to.deep.equal(helpers.getSummaryObject(0, 2, 2))

      expect(eventsResponse.body.events[0].id).to.be.equal(secondEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[0])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))
    })

    it('Should show also accepted attendance of people who unsubscribed', async () => {
      const firstEvent = await helpers.registerEvent(generate.event(prague.id))
      const secondEvent = await helpers.registerEvent(generate.event(seoul.id))

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, prague.id)

      await eventRegistrationService.register(user1.id, firstEvent.id, true)
      await eventRegistrationService.register(user2.id, firstEvent.id, true)

      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)
      await citySubscriptionService.unsubscribeUserFromCityEvents(user2.id, prague.id)

      const eventsResponse = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(eventsResponse.body).to.have.all.keys(['events'])
      expect(eventsResponse.body.events).to.be.an('array')
      expect(eventsResponse.body.events).to.be.length(2)

      expect(eventsResponse.body.events[1].id).to.be.equal(firstEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[1])).to.deep.equal(helpers.getSummaryObject(2, 0, 2))

      expect(eventsResponse.body.events[0].id).to.be.equal(secondEvent.id)
      expect(helpers.filterSummaries(eventsResponse.body.events[0])).to.deep.equal(helpers.getSummaryObject(0, 0, 0))
    })
  })
})
