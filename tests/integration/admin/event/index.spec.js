/* eslint-disable no-undef */
'use strict'

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const { resetDb } = require('../../../data/cleaner')
const app = require('../../../../src/app').callback()
const { User } = require('../../../../src/database')
const db = require('../../../../src/database')
const generate = require('../../../data/generate')
const crypt = require('../../../../src/utils/crypt')
const eventService = require('../../../../src/services/event-service')
const cityService = require('../../../../src/services/city-service')
const eventRegistrationService = require('../../../../src/services/event-registration-service')
const messageStateService = require('../../../../src/services/message-state-service')
const citySubscriptionService = require('../../../../src/services/city-subscription-service')
const stubs = require('../../sns-stub.spec')
const config = require('../../../../src/config')
const helpers = require('../../../helpers/events')
const exampleData = require('../../../data/examples')

describe('Endpoints: /admin/events', () => {
  let user
  let admin

  let city
  let city2
  let testCity

  beforeEach(async () => {
    await resetDb()

    user = await User.create({ ...generate.user() })
    user.token = await crypt.generateAccessToken(user.id)

    admin = await User.create({ ...generate.user(), role: 'admin' })
    admin.token = await crypt.generateAccessToken(admin.id)

    testCity = await cityService.getById(1)
    city = await helpers.registerCity(generate.city())
    city2 = await helpers.registerCity(generate.city())
  })

  describe('GET /admin/events', () => {
    it('should get all events', async () => {

      const response1 = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(response1.body).to.have.all.keys(['events'])
      expect(response1.body.events).to.be.an('array')
      expect(response1.body.events).to.be.length(0)

      const eventWithCity = await helpers.registerEvent(generate.event(city.id))
      const eventForAll = await helpers.registerEvent(generate.event(null))

      const response2 = await supertest(app)
        .get('/admin/events')
        .set('Authorization', admin.token)
        .expect(200)

      expect(response2.body).to.have.all.keys(['events'])
      expect(response2.body.events).to.be.an('array')
      expect(response2.body.events).to.be.length(2)
      expect(response2.body.events[0]).to.be.shallowDeepEqual(eventForAll)
      expect(response2.body.events[1]).to.be.shallowDeepEqual(eventWithCity)
    })

    it('should return 401 when Authorisation header is missing', async () => {
      await supertest(app)
        .get('/admin/events')
        .expect(401)
    })

    it('should return 403 when user has not admin rights', async () => {
      await supertest(app)
        .get('/admin/events')
        .set('Authorization', user.token)
        .expect(403)
    })
  })

  describe('POST /admin/events', () => {
    it('create new events schema', async () => {
      const event = helpers.stringifyDates(generate.event(city.id))
      const createResponse = await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(201)

      expect(createResponse.body).to.have.all.keys(['events'])
      expect(createResponse.body.events).to.be.an('array')
      expect(createResponse.body.events).to.be.length(1)
      expect(createResponse.body.events[0]).to.deep.include(helpers.omitStartAndEndDate(event))
      expect(createResponse.body.events[0].startDate).to.be.equal(event.startDate)
      expect(createResponse.body.events[0].endDate).to.be.equal(event.endDate)
    })

    it('should create an event', async () => {
      const event = helpers.stringifyDates(generate.event(city.id, { includeLink: true }))
      const createResponse = await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(201)

      expect(createResponse.body).to.have.all.keys(['events'])
      expect(createResponse.body.events).to.be.an('array')
      expect(createResponse.body.events).to.be.length(1)
      expect(createResponse.body.events[0]).to.deep.include(helpers.omitStartAndEndDate(event))
      expect(createResponse.body.events[0].startDate).to.be.equal(event.startDate)
      expect(createResponse.body.events[0].endDate).to.be.equal(event.endDate)
    })

    it('should not create an event with the same name/date/city', async () => {
      const event = helpers.stringifyDates(generate.event(city.id))

      await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(201)

      await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(409)
    })

    it('should create another event, if one of name/date/city is different', async () => {
      const event = helpers.stringifyDates(generate.event(city.id))

      await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(201)

      await supertest(app)
        .post('/admin/events')
        .send({ ...event, name: 'DIFFERENT NAME' })
        .set('Authorization', admin.token)
        .expect(201)

      await supertest(app)
        .post('/admin/events')
        .send({ ...event, startDate: '1/1/2911' })
        .set('Authorization', admin.token)
        .expect(201)

      await supertest(app)
        .post('/admin/events')
        .send({ ...event, endDate: '2/2/3911' })
        .set('Authorization', admin.token)
        .expect(201)

      await supertest(app)
        .post('/admin/events')
        .send({ ...event, cityId: city2.id })
        .set('Authorization', admin.token)
        .expect(201)
    })

    it('should create an event for all users', async () => {
      const event = helpers.stringifyDates(generate.event(null))

      const createResponse = await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(201)

      expect(createResponse.body).to.have.all.keys(['events'])
      expect(createResponse.body.events).to.be.an('array')
      expect(createResponse.body.events).to.be.length(1)
      expect(createResponse.body.events[0]).to.deep.include(event)
    })

    it('should return 401 when Authorisation header is missing', async () => {
      const event = generate.event(city.id)

      await supertest(app)
        .post('/admin/events')
        .send(event)
        .expect(401)
    })

    it('should return 403 when user has not admin rights', async () => {
      const event = generate.event(city.id)

      await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', user.token)
        .expect(403)
    })

    it('should create with long description', async () => {
      const event = helpers.stringifyDates(generate.event(null, { descriptionWords: 150 }))

      const createResponse = await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(201)

      expect(createResponse.body).to.have.all.keys(['events'])
      expect(createResponse.body.events).to.be.an('array')
      expect(createResponse.body.events).to.be.length(1)
      expect(createResponse.body.events[0]).to.deep.include(event)
    })

    it('should not create an event with too short description (<60 characters(', async () => {
      const event = helpers.stringifyDates(generate.event(null))
      event.description = 'x'.repeat(59)

      await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(400)
    })

    it('should not create an event in the past', async () => {
      const event = helpers.stringifyDates(generate.event(null, { descriptionWords: 150 }))
      event.date = '12/12/2016'

      await supertest(app)
        .post('/admin/events')
        .send(event)
        .set('Authorization', admin.token)
        .expect(400)
    })
  })

  describe('PATCH /admin/events/:eventId', () => {
    it('should update an event name', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { includeLink: true })))[0])
      const newName = 'new event name'

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ name: newName })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(newName)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
      expect(updateResponse.body.link.text).to.be.equal(event.link.text)
      expect(updateResponse.body.link.url).to.be.equal(event.link.url)
    })

    it('should update an event description', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { includeLink: true })))[0])
      const newDescription = 'new event description'

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ description: newDescription })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(newDescription)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
      expect(updateResponse.body.link.text).to.be.equal(event.link.text)
      expect(updateResponse.body.link.url).to.be.equal(event.link.url)
    })

    it('should update an event start date', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { includeLink: true })))[0])
      const newStartDate = new Date(event.startDate)
      newStartDate.setFullYear(newStartDate.getFullYear() - 1)
      const expectedStartDateString = helpers.stringifyDates(newStartDate)

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ startDate: newStartDate })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(expectedStartDateString)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
      expect(updateResponse.body.link.text).to.be.equal(event.link.text)
      expect(updateResponse.body.link.url).to.be.equal(event.link.url)
    })

    it('should update an event end date', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { includeLink: true })))[0])
      const newEndDate = new Date(event.endDate)
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)
      const expectedEndDateString = helpers.stringifyDates(newEndDate)

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ endDate: newEndDate })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(expectedEndDateString)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
      expect(updateResponse.body.link.text).to.be.equal(event.link.text)
      expect(updateResponse.body.link.url).to.be.equal(event.link.url)
    })

    it('should update an event location', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { includeLink: true })))[0])
      const newLocation = 'New location for event to take place'

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ location: newLocation })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(newLocation)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
      expect(updateResponse.body.link.text).to.be.equal(event.link.text)
      expect(updateResponse.body.link.url).to.be.equal(event.link.url)
    })

    it('should update an event imageURL', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { includeLink: true })))[0])
      const newImageUrl = 'https://imgur.com/funnypicofcatcrying'

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ imageUrl: newImageUrl })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(newImageUrl)
      expect(updateResponse.body.link.text).to.be.equal(event.link.text)
      expect(updateResponse.body.link.url).to.be.equal(event.link.url)
    })

    it('should update an event link', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { includeLink: true })))[0])
      const newLink = {
        text: 'Updated link',
        url: 'https://iphone14.info/buyme',
      }

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ link: newLink })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
      expect(updateResponse.body.link.text).to.be.equal(newLink.text)
      expect(updateResponse.body.link.url).to.be.equal(newLink.url)
    })

    it('should update/add an event link', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id)))[0])
      const newLink = {
        text: 'Updated link',
        url: 'https://iphone14.info/buyme',
      }

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ link: newLink })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
      expect(updateResponse.body.link.text).to.be.equal(newLink.text)
      expect(updateResponse.body.link.url).to.be.equal(newLink.url)
    })

    it('should remove an event link', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id)))[0])

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ link: null })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
      expect(updateResponse.body.link).to.be.equal(null)
    })

    it('should not update an event if it would break the name/startDate/endDate/city uniqueness', async () => {
      const eventInfo1 = generate.event(city.id)
      const eventInfo2 = { ...eventInfo1, name: 'someDifferentNameFromFirstEvent' }

      const event1 = helpers.stringifyDates((await eventService.register(eventInfo1))[0])
      const event2 = helpers.stringifyDates((await eventService.register(eventInfo2))[0])

      await supertest(app)
        .patch(`/admin/events/${event2.id}`)
        .send({ name: event1.name })
        .set('Authorization', admin.token)
        .expect(409)
    })

    it('should be able to update itself with the same values', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id)))[0])

      const updateResponse = await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ name: event.name })
        .set('Authorization', admin.token)
        .expect(200)

      expect(updateResponse.body).to.be.an('object')
      expect(updateResponse.body).to.contain.keys(['name', 'description', 'startDate', 'endDate', 'location', 'imageUrl', 'link'])
      expect(updateResponse.body.name).to.be.equal(event.name)
      expect(updateResponse.body.description).to.be.equal(event.description)
      expect(updateResponse.body.startDate).to.be.equal(event.startDate)
      expect(updateResponse.body.endDate).to.be.equal(event.endDate)
      expect(updateResponse.body.location).to.be.equal(event.location)
      expect(updateResponse.body.imageUrl).to.be.equal(event.imageUrl)
    })

    it('should return 401 when Authorisation header is missing', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])
      const newName = 'new event name'

      await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ name: newName })
        .expect(401)
    })

    it('should return 403 when user has not admin rights', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])
      const newName = 'new event name'

      await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ name: newName })
        .set('Authorization', user.token)
        .expect(403)
    })

    it('should return 404 when updatin not existing event', async () => {
      await eventService.register(generate.event(city.id, { useRegularDate: true }))
      const newName = 'new event name'

      await supertest(app)
        .patch('/admin/events/12345')
        .send({ name: newName })
        .set('Authorization', admin.token)
        .expect(404)
    })

    it('should return 400 when sending empty update data', async () => {
      await eventService.register(generate.event(city.id, { useRegularDate: true }))

      await supertest(app)
        .patch('/admin/events/12345')
        .send({})
        .set('Authorization', admin.token)
        .expect(400)
    })

    it('should not an event date to be in the past', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])

      await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ date: '12/12/2016' })
        .set('Authorization', admin.token)
        .expect(400)
    })

    it('Cannot change cityId to the same value', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(testCity.id, { useRegularDate: true })))[0])

      await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ testCity: city.id })
        .set('Authorization', admin.token)
        .expect(400)
    })

    it('Cannot change cityId to the same value (null to null)', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(null, { useRegularDate: true })))[0])

      await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ testCity: null })
        .set('Authorization', admin.token)
        .expect(400)
    })

    it('Changing event from test city to regular city sends push notification', async () => {
      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', user.token)
        .send(exampleData.pushTokenData)
        .expect(204)

      const userEndpointArn = (await db.PushToken.findOne({ where: { userId: user.id } })).endpointArn

      await citySubscriptionService.subscribeUserToCityEvents(user.id, city.id)
      const event = helpers.stringifyDates((await eventService.register(generate.event(testCity.id, { useRegularDate: true })))[0])

      expect(stubs.publishStub.callCount).to.be.equal(0)

      await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ cityId: city.id })
        .set('Authorization', admin.token)
        .expect(200)

      expect(stubs.publishStub.callCount).to.be.equal(1)
      expect(stubs.publishStub.getCall(0).args[0].TargetArn).to.be.equal(userEndpointArn)

      const inboxEvents = await eventService.upcomingEventsWithGoingStatus(user.id)
      expect(inboxEvents).to.be.length(1)
      expect(inboxEvents[0].name).to.be.equal(event.name)
    })

    it('Changing event from test city to no city (global event) sends push notification', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user.id, city.id)
      await citySubscriptionService.subscribeUserToCityEvents(user.id, testCity.id)
      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', user.token)
        .send(exampleData.pushTokenData)
        .expect(204)

      const userEndpointArn = (await db.PushToken.findOne({ where: { userId: user.id } })).endpointArn

      const event = helpers.stringifyDates((await eventService.register(generate.event(testCity.id, { useRegularDate: true })))[0])

      expect(stubs.publishStub.callCount).to.be.equal(1)
      expect(stubs.publishStub.getCall(0).args[0].TargetArn).to.be.equal(userEndpointArn)

      await supertest(app)
        .patch(`/admin/events/${event.id}`)
        .send({ cityId: null })
        .set('Authorization', admin.token)
        .expect(200)

      expect(stubs.publishStub.callCount).to.be.equal(2)
      expect(stubs.publishStub.getCall(1).args[0].TopicArn).to.be.equal(config.aws.sns.generalTopicArn)

      const inboxEvents = await eventService.upcomingEventsWithGoingStatus(user.id)
      expect(inboxEvents).to.be.length(1)
      expect(inboxEvents[0].name).to.be.equal(event.name)
    })
  })

  describe('GET /admin/events/:eventId', () => {
    it('should get a single event', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])

      const createResponse = await supertest(app)
        .get(`/admin/events/${event.id}`)
        .set('Authorization', admin.token)
        .expect(200)

      expect(createResponse.body).to.be.an('object')
      expect(createResponse.body).to.shallowDeepEqual(helpers.omitEventAttendanceNumbers(event))
    })

    it('should return 401 when Authorisation header is missing', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])

      await supertest(app)
        .get(`/admin/events/${event.id}`)
        .expect(401)
    })

    it('should return 403 when user has not admin rights', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])

      await supertest(app)
        .get(`/admin/events/${event.id}`)
        .set('Authorization', user.token)
        .expect(403)
    })

    it('should return 404 when asking for not existing event', async () => {
      await eventService.register(generate.event(city.id, { useRegularDate: true }))

      await supertest(app)
        .get('/admin/events/12345')
        .set('Authorization', admin.token)
        .expect(404)
    })
  })

  describe('DELETE /admin/events/:events', () => {
    it('should delete an event and coresponding entities', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])
      await citySubscriptionService.subscribeUserToCityEvents(admin.id, city.id)
      await eventRegistrationService.register(admin.id, event.id, true)
      await messageStateService.interactWithMessage(admin.id, { eventId: event.id }, 'seen')

      const eventRegistrationBeforeDelete = await db.EventRegistration.findAll({ where: { userId: admin.id } })
      const messageStateBeforeDelete = await db.MessageInteraction.findAll({ where: { userId: admin.id } })
      const eventBeforeDelete = await db.Event.findByPk(event.id)

      expect(eventRegistrationBeforeDelete).to.not.be.length(0)
      expect(messageStateBeforeDelete).to.not.be.length(0)
      expect(eventBeforeDelete).to.not.be.equal(null)

      const response = await supertest(app)
        .delete(`/admin/events/${event.id}`)
        .set('Authorization', admin.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['events'])
      expect(response.body.events).to.be.an('array')
      expect(response.body.events).to.be.length(0)

      const eventRegistrationAfterDelete = await db.EventRegistration.findAll({ where: { userId: admin.id } })
      const messageStateAfterDelete = await db.MessageInteraction.findAll({ where: { userId: admin.id } })
      const eventAfterDelete = await db.Event.findByPk(event.id)

      expect(eventRegistrationAfterDelete).to.be.length(0)
      expect(messageStateAfterDelete).to.be.length(0)
      expect(eventAfterDelete).to.be.equal(null)
    })

    it('should return 403 when user is not admin', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])

      await supertest(app)
        .delete(`/admin/events/${event.id}`)
        .set('Authorization', user.token)
        .expect(403)
    })

    it('should return 404 for non existing event', async () => {
      await supertest(app)
        .delete('/admin/events/123456')
        .set('Authorization', admin.token)
        .expect(404)
    })

    it('should not delete an event twice (return 404 second time)', async () => {
      const event = helpers.stringifyDates((await eventService.register(generate.event(city.id, { useRegularDate: true })))[0])

      await supertest(app)
        .delete(`/admin/events/${event.id}`)
        .set('Authorization', admin.token)
        .expect(200)

      await supertest(app)
        .delete(`/admin/events/${event.id}`)
        .set('Authorization', admin.token)
        .expect(404)

    })
  })
})
