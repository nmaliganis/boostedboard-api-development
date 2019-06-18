'use strict'

const supertest = require('supertest')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()
const userService = require('../../src/services/user-service')
const citySubscriptionService = require('../../src/services/city-subscription-service')
const { resetDb } = require('../data/cleaner')
const { User, CitySubscription } = require('../../src/database')
const crypt = require('../../src/utils/crypt')
const helpers = require('../helpers/events')
const exampleData = require('../data/examples')

describe('Endpoints: /cities/subscriptions', () => {
  let user1
  let user2

  let prague
  let seoul

  beforeEach(async () => {
    await resetDb()

    user1 = await User.create({ ...generate.user() })
    user1.token = await crypt.generateAccessToken(user1.id)

    user2 = await User.create({ ...generate.user() })
    user2.token = await crypt.generateAccessToken(user2.id)

    prague = await helpers.registerCity(exampleData.pragueData)
    seoul = await helpers.registerCity(exampleData.seoulData)
  })

  describe('GET /users/me - (only city subscriptions)', () => {
    it('should return all subscriptions for a user', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      const response = await supertest(app)
        .get('/users/me')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body.profile.subscribedCities).to.be.an('array')
      expect(response.body.profile.subscribedCities).to.be.length(2)
      expect(response.body.profile.subscribedCities[0]).to.shallowDeepEqual(prague)
      expect(response.body.profile.subscribedCities[1]).to.shallowDeepEqual(seoul)
    })
  })

  describe('GET /cities/subscriptions', () => {
    it('should return all subscriptions for a user', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      const response = await supertest(app)
        .get('/cities/subscriptions')
        .set('Authorization', user1.token)
        .expect(200)

      expect(response.body.subscribedCities).to.be.an('array')
      expect(response.body.subscribedCities).to.be.length(2)
      expect(response.body.subscribedCities[0]).to.shallowDeepEqual(prague)
      expect(response.body.subscribedCities[1]).to.shallowDeepEqual(seoul)
    })
  })

  describe('POST /cities/subscriptions', () => {
    it('should subscribe user to a city', async () => {
      await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: prague.id })
        .set('Authorization', user1.token)
        .expect(201)
    })

    it('should return all subscribed cities', async () => {
      const response1 = await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: prague.id })
        .set('Authorization', user1.token)
        .expect(201)

      expect(response1.body.subscribedCities).to.be.an('array')
      expect(response1.body.subscribedCities).to.be.length(1)
      expect(response1.body.subscribedCities[0]).to.shallowDeepEqual(prague)

      const response2 = await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: seoul.id })
        .set('Authorization', user1.token)
        .expect(201)

      expect(response2.body.subscribedCities).to.be.an('array')
      expect(response2.body.subscribedCities).to.be.length(2)
      expect(response2.body.subscribedCities[0]).to.shallowDeepEqual(prague)
      expect(response2.body.subscribedCities[1]).to.shallowDeepEqual(seoul)
    })

    it('List of subscribed cities is sorted alphabetically', async () => {

      const d1 = {
        name: 'A',
        location: [13, 20],
      }
      const d2 = {
        name: 'C',
        location: [22, 80],
      }
      const d3 = {
        name: 'I',
        location: [11, 20],
      }
      const d4 = {
        name: 'B',
        location: [51, 70],
      }
      const d5 = {
        name: 'F',
        location: [45, 30],
      }
      const d6 = {
        name: 'H',
        location: [92, 50],
      }
      const d7 = {
        name: 'E',
        location: [44, 40],
      }
      const d8 = {
        name: 'G',
        location: [15, 60],
      }

      const c1 = await helpers.registerCity(d1)
      const c2 = await helpers.registerCity(d2)
      const c3 = await helpers.registerCity(d3)
      const c4 = await helpers.registerCity(d4)
      const c5 = await helpers.registerCity(d5)
      const c6 = await helpers.registerCity(d6)
      const c7 = await helpers.registerCity(d7)
      const c8 = await helpers.registerCity(d8)

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, c1.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, c2.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, c3.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, c4.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, c5.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, c6.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, c7.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, c8.id)

      const responseCities = await supertest(app)
        .get('/cities/subscriptions')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseCities.body.subscribedCities.map(city => city.id)).to.deep.equal([4, 7, 5, 10, 8, 11, 9, 6])

      const responseMe = await supertest(app)
        .get('/users/me')
        .set('Authorization', user1.token)
        .expect(200)

      expect(responseMe.body.profile.subscribedCities.map(city => city.id)).to.deep.equal([4, 7, 5, 10, 8, 11, 9, 6])
    })

    it('subscribing to a city for one user should not affect other users', async () => {
      await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: prague.id })
        .set('Authorization', user1.token)
        .expect(201)

      await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: seoul.id })
        .set('Authorization', user1.token)
        .expect(201)

      const subscriptions = await citySubscriptionService.getSubscribedCities(user2.id)

      expect(subscriptions).to.be.an('array')
      expect(subscriptions).to.be.length(0)
    })

    it('should return 409 when user already subscribed to a city', async () => {
      await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: prague.id })
        .set('Authorization', user1.token)
        .expect(201)

      await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: prague.id })
        .set('Authorization', user1.token)
        .expect(409)
    })

    it('should allow user to delete subscription and reregister', async () => {
      await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: prague.id })
        .set('Authorization', user1.token)
        .expect(201)

      await citySubscriptionService.unsubscribeUserFromCityEvents(user1.id, prague.id)

      await supertest(app)
        .post('/cities/subscriptions')
        .send({ cityId: prague.id })
        .set('Authorization', user1.token)
        .expect(201)

      const subscriptions = await citySubscriptionService.getSubscriptions(user1.id)
      expect(subscriptions).to.be.length(1)
      expect(subscriptions[0].cityId).to.be.equal(prague.id)
      expect(subscriptions[0].userId).to.be.equal(user1.id)
      expect(helpers.stringifyDates(subscriptions[0].city)).to.shallowDeepEqual(prague)
    })
  })

  describe('DELETE /cities/subscriptions/:cityId', () => {
    it('should delete subscription', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)

      const response1 = await supertest(app)
        .delete(`/cities/subscriptions/${prague.id}`)
        .set('Authorization', user1.token)
        .expect(200)

      const subscribedCitiesAfter1Delete = await helpers.subscribedCitiesForUser(user1.id)
      expect(subscribedCitiesAfter1Delete).to.be.shallowDeepEqual(response1.body.subscribedCities)
      expect(response1.body.subscribedCities).to.be.an('array')
      expect(response1.body.subscribedCities).to.be.length(1)
      expect(response1.body.subscribedCities[0]).to.shallowDeepEqual(seoul)

      const response2 = await supertest(app)
        .delete(`/cities/subscriptions/${seoul.id}`)
        .set('Authorization', user1.token)
        .expect(200)

      const subscribedCitiesAfter2Delete = await helpers.subscribedCitiesForUser(user1.id)
      expect(subscribedCitiesAfter2Delete).to.be.shallowDeepEqual(response2.body.subscribedCities)
      expect(response2.body.subscribedCities).to.be.an('array')
      expect(response2.body.subscribedCities).to.be.length(0)
    })

    it('should delete subscription and it should be also deleted from the DB', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)

      await supertest(app)
        .delete(`/cities/subscriptions/${prague.id}`)
        .set('Authorization', user1.token)
        .expect(200)

      await supertest(app)
        .delete(`/cities/subscriptions/${seoul.id}`)
        .set('Authorization', user1.token)
        .expect(200)

      const deletedSubscriptions = await citySubscriptionService.getSubscriptions(user1.id)
      expect(deletedSubscriptions).to.be.length(0)
    })

    it('should (hard) delete subscriptions when user is deleted.', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, seoul.id)

      const subscriptionsBeforeDelete = (await CitySubscription.findAll()).map(sub => ({
        userId: sub.userId,
        deletedAt: sub.deletedAt,
      }))

      expect(subscriptionsBeforeDelete).to.be.an('array')
      expect(subscriptionsBeforeDelete).to.be.length(2)
      expect(subscriptionsBeforeDelete.map(sub => sub.userId)).to.have.members([1, 2])

      await userService.remove(user1.id)

      const subscriptionsAfterDelete = (await CitySubscription.findAll()).map(sub => ({
        userId: sub.userId,
        deletedAt: sub.deletedAt,
      }))

      expect(subscriptionsAfterDelete).to.be.an('array')
      expect(subscriptionsAfterDelete).to.be.length(1)
      expect(subscriptionsAfterDelete.map(sub => sub.userId)).to.have.members([2])
    })
  })
})
