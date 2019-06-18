'use strict'

const supertest = require('supertest')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()
const { resetDb } = require('../data/cleaner')
const { User } = require('../../src/database')
const crypt = require('../../src/utils/crypt')
const config = require('../../src/config')
const citySubscriptionService = require('../../src/services/city-subscription-service')
const helpers = require('../helpers/events')
const exampleData = require('../data/examples')

const closeToPrague = [14.6592, 50.1863]
const closeToLiberec = [15.1703, 50.7221]
const outsideOfPragueRange = [14.3175, 48.8127]

function locationToQuery([long, lat]) {
  return `?long=${long}&lat=${lat}`
}

describe('Endpoints: /cities/location', () => {
  let prague
  let liberec

  let user

  beforeEach(async () => {
    await resetDb()
    user = await User.create({ ...generate.user() })
    user.token = await crypt.generateAccessToken(user.id)

    prague = await helpers.registerCity(exampleData.pragueData)
    liberec = await helpers.registerCity(exampleData.liberecData)
  })

  describe('GET /cities/location', () => {

    it('should return a location', async () => {
      const response = await supertest(app)
        .get(`/cities/location${locationToQuery(closeToPrague)}`)
        .set('Authorization', user.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['currentLocation'])
      expect(response.body.currentLocation).not.to.equal(null)
    })

    it('should return Prague when in Prague', async () => {
      const response = await supertest(app)
        .get(`/cities/location${locationToQuery(prague.location)}`)
        .set('Authorization', user.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['currentLocation'])
      expect(response.body.currentLocation).to.shallowDeepEqual(exampleData.pragueData)
    })

    it('should return Prague when close to Prague', async () => {
      const response = await supertest(app)
        .get(`/cities/location${locationToQuery(closeToPrague)}`)
        .set('Authorization', user.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['currentLocation'])
      expect(response.body.currentLocation).to.shallowDeepEqual(exampleData.pragueData)
    })

    it('should return Liberec when close to Liberec', async () => {
      const response = await supertest(app)
        .get(`/cities/location${locationToQuery(closeToLiberec)}`)
        .set('Authorization', user.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['currentLocation'])
      expect(response.body.currentLocation).not.to.equal(liberec.location)
    })

    it('should return no location when no city is near by', async () => {
      const response = await supertest(app)
        .get(`/cities/location${locationToQuery(outsideOfPragueRange)}`)
        .set('Authorization', user.token)
        .expect(200)

      expect(response.body.currentLocation).to.equal(null)
    })

    it('should return return 400 when there are additional query parameters', async () => {
      await supertest(app)
        .get(`/cities/location${locationToQuery(outsideOfPragueRange)}&diameter=120`)
        .set('Authorization', user.token)
        .expect(400)
    })

    it('should return return 400 when query parameters are missing', async () => {
      await supertest(app)
        .get('/cities/location')
        .set('Authorization', user.token)
        .expect(400)
    })

    it('should return return 401 when not signed in', async () => {
      await supertest(app)
        .get(`/cities/location${locationToQuery(outsideOfPragueRange)}`)
        .expect(401)
    })
  })
})

describe('Endpoints: /cities', () => {
  let user

  let prague
  let liberec
  let seoul

  beforeEach(async () => {
    await resetDb()
    user = await User.create({ ...generate.user() })
    user.token = await crypt.generateAccessToken(user.id)

    prague = await helpers.registerCity(exampleData.pragueData)
    liberec = await helpers.registerCity(exampleData.liberecData)
    seoul = await helpers.registerCity(exampleData.seoulData)
  })

  describe('GET /cities(?lat=xxx&long=yyy)', () => {
    it('should filter out the test city', async () => {
      const response = await supertest(app)
        .get('/cities')
        .set('Authorization', user.token)
        .expect(200)

      const filteredCities = response.body.cities.filter(city => city.name === config.app.cities.testCity.name)

      expect(filteredCities).to.be.an('array')
      expect(filteredCities).to.be.length(0)
    })

    it('sort the cities geopgrahically when location provided', async () => {
      const pragueResponse = await supertest(app)
        .get('/cities?lat=50.0755&long=14.4378')
        .set('Authorization', user.token)
        .expect(200)

      expect(pragueResponse.body.cities).to.be.deep.equal([prague, liberec, seoul])

      const seoulResponse = await supertest(app)
        .get('/cities?lat=37.5665&long=126.9780')
        .set('Authorization', user.token)
        .expect(200)

      expect(seoulResponse.body.cities).to.be.deep.equal([seoul, liberec, prague])
    })

    it('sort the cities alphabetically', async () => {
      const response = await supertest(app)
        .get('/cities')
        .set('Authorization', user.token)
        .expect(200)

      expect(response.body.cities).to.be.deep.equal([liberec, prague, seoul])
    })

    it('filters out already subscribed cities', async () => {
      const response1 = await supertest(app)
        .get('/cities')
        .set('Authorization', user.token)
        .expect(200)
      expect(response1.body.cities).to.be.deep.equal([liberec, prague, seoul])

      await citySubscriptionService.subscribeUserToCityEvents(user.id, prague.id)
      const response2 = await supertest(app)
        .get('/cities')
        .set('Authorization', user.token)
        .expect(200)
      expect(response2.body.cities).to.be.deep.equal([liberec, seoul])

      await citySubscriptionService.subscribeUserToCityEvents(user.id, liberec.id)
      const response3 = await supertest(app)
        .get('/cities')
        .set('Authorization', user.token)
        .expect(200)
      expect(response3.body.cities).to.be.deep.equal([seoul])

      await citySubscriptionService.subscribeUserToCityEvents(user.id, seoul.id)
      const response4 = await supertest(app)
        .get('/cities')
        .set('Authorization', user.token)
        .expect(200)
      expect(response4.body.cities).to.be.deep.equal([])
    })

    it('Does not filter out cities you subscribed and unsubscribed', async () => {
      await citySubscriptionService.subscribeUserToCityEvents(user.id, prague.id)
      await citySubscriptionService.unsubscribeUserFromCityEvents(user.id, prague.id)

      const response = await supertest(app)
        .get('/cities')
        .set('Authorization', user.token)
        .expect(200)

      expect(response.body.cities).to.be.deep.equal([liberec, prague, seoul])
    })
  })
})
