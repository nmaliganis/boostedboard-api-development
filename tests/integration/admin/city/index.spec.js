'use strict'

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const { resetDb } = require('../../../data/cleaner')
const { User } = require('../../../../src/database')
const db = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')
const app = require('../../../../src/app').callback()
const cityService = require('../../../../src/services/city-service')
const citySubscriptionService = require('../../../../src/services/city-subscription-service')
const eventService = require('../../../../src/services/event-service')
const config = require('../../../../src/config')

function getDateshiftedByDays(days) {
  const today = new Date()
  today.setDate(today.getDate() + days)
  return today
}

const eventData = {
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

const pushTokenData = {
  token: 'ABCD',
}

describe('Endpoints: /admin/cities', () => {
  let admin
  let user

  beforeEach(async () => {
    await resetDb()
    admin = await User.create({ ...generate.user(), role: 'admin' })
    admin.token = await crypt.generateAccessToken(admin.id)

    user = await User.create({ ...generate.user() })
    user.token = await crypt.generateAccessToken(user.id)
  })

  describe('GET /admin/cities', () => {
    it('should return all the existing cities in the response', async () => {
      const city = generate.city()
      await cityService.register(city)

      const response = await supertest(app)
        .get('/admin/cities')
        .set('Authorization', admin.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['cities'])
      expect(response.body.cities).to.be.an('array')
      expect(response.body.cities).to.be.length(2)
      expect(response.body.cities[1]).to.be.shallowDeepEqual(city)
    })

    it('should contain the test city', async () => {
      const response = await supertest(app)
        .get('/admin/cities')
        .set('Authorization', admin.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['cities'])
      expect(response.body.cities).to.be.an('array')
      expect(response.body.cities).to.be.length(1)
      expect(response.body.cities[0].name).to.be.equal(config.app.cities.testCity.name)
    })
  })

  describe('GET /admin/cities/:cityId', () => {
    it('should return a single city in the response', async () => {
      const city = generate.city()
      const registeredCity = (await cityService.register(city))[1]

      const response = await supertest(app)
        .get(`/admin/cities/${registeredCity.id}`)
        .set('Authorization', admin.token)
        .expect(200)

      expect(response.body).to.be.an('object')
      expect(response.body).to.be.shallowDeepEqual(city)
    })

    it('should return 404 for non existing city', async () => {
      await cityService.register(generate.city())

      await supertest(app)
        .get('/admin/cities/12345')
        .set('Authorization', admin.token)
        .expect(404)
    })

    it('should return the test city', async () => {
      const testCity = (await cityService.getAll(true)).find(city => city.name === config.app.cities.testCity.name)

      const response = await supertest(app)
        .get(`/admin/cities/${testCity.id}`)
        .set('Authorization', admin.token)
        .expect(200)

      expect(response.body).to.be.an('object')
      expect(response.body.name).to.be.equal(config.app.cities.testCity.name)
    })
  })

  describe('POST /admin/cities', () => {
    it('should return all the existing cities in the response', async () => {
      const city1 = generate.city()
      const city2 = generate.city()

      const createFirstResponse = await supertest(app)
        .post('/admin/cities')
        .set('Authorization', admin.token)
        .send(city1)
        .expect(201)

      expect(createFirstResponse.body).to.have.all.keys(['cities'])
      expect(createFirstResponse.body.cities).to.be.an('array')
      expect(createFirstResponse.body.cities).to.be.length(2)
      expect(createFirstResponse.body.cities[1]).to.be.shallowDeepEqual(city1)

      const createSecondResponse = await supertest(app)
        .post('/admin/cities')
        .set('Authorization', admin.token)
        .send(city2)
        .expect(201)

      expect(createSecondResponse.body).to.have.all.keys(['cities'])
      expect(createSecondResponse.body.cities).to.be.an('array')
      expect(createSecondResponse.body.cities).to.be.length(3)
      expect(createSecondResponse.body.cities[1]).to.be.shallowDeepEqual(city1)
      expect(createSecondResponse.body.cities[2]).to.be.shallowDeepEqual(city2)
    })

    it('should not create the same city twice', async () => {
      const city1 = generate.city()

      await supertest(app)
        .post('/admin/cities')
        .set('Authorization', admin.token)
        .send(city1)
        .expect(201)

      await supertest(app)
        .post('/admin/cities')
        .set('Authorization', admin.token)
        .send(city1)
        .expect(409)
    })
  })

  describe('PATCH /admin/cities/:cityId', () => {
    let city1
    let city2

    beforeEach(async () => {
      await cityService.register(generate.city())
      ;[, city1, city2] = await cityService.register(generate.city())
    })

    it('should return 200', async () => {
      await supertest(app)
        .patch(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .send({ name: generate.chance.word({ length: 10 }) })
        .expect(200)
    })

    it('should return city with updated name', async () => {
      const newName = generate.chance.word({ length: 10 })
      const response = await supertest(app)
        .patch(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .send({ name: newName })
        .expect(200)

      expect(response.body.name).to.be.equal(newName)
      expect(response.body.location).to.be.deep.closeTo(city1.location, 1e-6)
    })

    it('should return city with updated location', async () => {
      const newLocation = generate.location()
      const response = await supertest(app)
        .patch(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .send({ location: newLocation })
        .expect(200)

      expect(response.body.name).to.be.equal(city1.name)
      expect(response.body.location).to.be.deep.closeTo(newLocation, 1e-6)
    })

    it('should return city with updated name and location', async () => {
      const newName = generate.chance.word({ length: 10 })
      const newLocation = generate.location()
      const response = await supertest(app)
        .patch(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .send({ name: newName, location: newLocation })
        .expect(200)

      expect(response.body.name).to.be.equal(newName)
      expect(response.body.location).to.be.deep.closeTo(newLocation, 1e-6)
    })

    it('should return city with updated radius', async () => {
      const newRadius = 123
      const response = await supertest(app)
        .patch(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .send({ radius: newRadius })
        .expect(200)

      expect(response.body.radius).to.be.equal(newRadius)
    })

    it('should return city with updated imageUrl', async () => {
      const newImageUrl = generate.chance.url()
      const response = await supertest(app)
        .patch(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .send({ imageUrl: newImageUrl })
        .expect(200)

      expect(response.body.imageUrl).to.be.equal(newImageUrl)
    })

    it('should not be posible to update name to value used on some other city', async () => {
      const newName = city2.name
      await supertest(app)
        .patch(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .send({ name: newName })
        .expect(409)
    })

    it('should return 404 when updating not existing city', async () => {
      const newName = generate.chance.word({ length: 10 })
      await supertest(app)
        .patch('/admin/cities/12345')
        .set('Authorization', admin.token)
        .send({ name: newName })
        .expect(404)
    })

    it('return 400 when updating invalid field', async () => {
      const newFieldValue = generate.chance.word({ length: 10 })
      await supertest(app)
        .patch('/admin/cities/12345')
        .set('Authorization', admin.token)
        .send({ randomFieldThatDoesntExist: newFieldValue })
        .expect(400)
    })

    it('return 400 when sending empty update data', async () => {
      await supertest(app)
        .patch('/admin/cities/12345')
        .set('Authorization', admin.token)
        .send({})
        .expect(400)
    })

    it('returns 403 for non-admin user', async () => {
      const newName = generate.chance.word({ length: 10 })
      await supertest(app)
        .patch(`/admin/cities/${city1.id}`)
        .set('Authorization', user.token)
        .send({ name: newName })
        .expect(403)
    })

    it('should not modify the test city', async () => {
      const testCity = (await cityService.getAll(true)).find(city => city.name === config.app.cities.testCity.name)
      await supertest(app)
        .patch(`/admin/cities/${testCity.id}`)
        .set('Authorization', admin.token)
        .send({ radius: 123 })
        .expect(403)
    })
  })

  describe('DELETE /admin/cities/:cityId', () => {
    let city1

    let city1Data
    let city2Data

    beforeEach(async () => {
      city1Data = generate.city()
      city2Data = generate.city()

      await cityService.register(city1Data)
      ;[, city1] = await cityService.register(city2Data)
    })

    it('should delete a city, coresponding SNS topic and other entities', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(admin.id, city1.id)
      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', admin.token)
        .send(pushTokenData)
        .expect(204)

      const citySubscriptionBeforeDelete = await db.CitySubscription.findAll({ where: { userId: admin.id } })
      const subscriptionArnBeforeDelete = await db.SubscriptionArn.findAll({ where: { userId: admin.id } })
      const cityBeforeDelete = await db.City.findByPk(city1.id)

      expect(citySubscriptionBeforeDelete).to.be.length(1)
      expect(subscriptionArnBeforeDelete).to.be.length(1)
      expect(cityBeforeDelete).to.not.be.equal(null)

      const response = await supertest(app)
        .delete(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['cities'])
      expect(response.body.cities).to.be.an('array')
      expect(response.body.cities).to.be.length(2)
      expect(response.body.cities[1]).to.be.shallowDeepEqual(city2Data)

      const citySubscriptionAfterDelete = await db.CitySubscription.findAll({ where: { userId: admin.id } })
      const subscriptionArnAfterDelete = await db.SubscriptionArn.findAll({ where: { userId: admin.id } })
      const cityAfterDelete = await db.City.findByPk(city1.id)

      expect(citySubscriptionAfterDelete).to.be.length(0)
      expect(subscriptionArnAfterDelete).to.be.length(1)
      expect(cityAfterDelete).to.be.equal(null)
    })

    it('should not delete a city where is happening an event', async () => {
      await eventService.register(eventData)

      await supertest(app)
        .delete(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .expect(409)
    })

    it('should return 403 when user is not admin', async () => {
      await supertest(app)
        .delete(`/admin/cities/${city1.id}`)
        .set('Authorization', user.token)
        .expect(403)
    })

    it('should return 404 for non existing city', async () => {
      await supertest(app)
        .delete('/admin/cities/123456')
        .set('Authorization', admin.token)
        .expect(404)
    })

    it('should not delete a city twice (return 404 second time)', async () => {
      await supertest(app)
        .delete(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .expect(200)

      await supertest(app)
        .delete(`/admin/cities/${city1.id}`)
        .set('Authorization', admin.token)
        .expect(404)
    })

    it('should not delete the test city', async () => {
      const testCity = (await cityService.getAll(true)).find(city => city.name === config.app.cities.testCity.name)
      await supertest(app)
        .delete(`/admin/cities/${testCity.id}`)
        .set('Authorization', admin.token)
        .expect(403)
    })
  })
})
