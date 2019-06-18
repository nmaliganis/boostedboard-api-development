'use strict'

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const { resetDb } = require('../../../data/cleaner')
const { User } = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')
const app = require('../../../../src/app').callback()
const cityService = require('../../../../src/services/city-service')
const citySubscriptionService = require('../../../../src/services/city-subscription-service')

const pragueData = {
  name: 'Prague',
  location: [14.42076, 50.08804],
}

const seoulData = {
  name: 'Seoul',
  location: [126.9780, 37.5665],
}

const liberecData = {
  name: 'Liberec',
  location: [15.0543, 50.7663],
}

async function registerCity(cityData) {
  return stringifyDates((await cityService.register(cityData)).find(city => city.name === cityData.name).get())
}

function stringifyDates(city) {
  return JSON.parse(JSON.stringify(city))
}


describe('Endpoints: /admin/cities', () => {
  let admin
  let user1
  let user2

  let prague
  let seoul
  let liberec

  beforeEach(async () => {
    await resetDb()

    admin = await User.create({ ...generate.user(), role: 'admin' })
    admin.token = await crypt.generateAccessToken(admin.id)

    user1 = await User.create({ ...generate.user() })
    user1.token = await crypt.generateAccessToken(user1.id)

    user2 = await User.create({ ...generate.user() })
    user2.token = await crypt.generateAccessToken(user2.id)

    prague = await registerCity(pragueData)
    seoul = await registerCity(seoulData)
    liberec = await registerCity(liberecData)
  })

  describe('GET /admin/cities/summary', () => {
    it('Should return summaries of cities - how many people are subscribed for each city', async () => {

      await citySubscriptionService.subscribeUserToCityEvents(user1.id, prague.id)
      await citySubscriptionService.subscribeUserToCityEvents(user1.id, seoul.id)
      await citySubscriptionService.subscribeUserToCityEvents(user2.id, prague.id)

      const response = await supertest(app)
        .get('/admin/cities/summary')
        .set('Authorization', admin.token)
        .expect(200)

      expect(response.body).to.have.all.keys(['summary'])
      expect(response.body.summary).to.be.an('array')
      expect(response.body.summary).to.be.length(4)
      expect(response.body.summary.find(sum => sum.city.id === prague.id).subscriberCount).to.be.equal(2)
      expect(response.body.summary.find(sum => sum.city.id === seoul.id).subscriberCount).to.be.equal(1)
      expect(response.body.summary.find(sum => sum.city.id === liberec.id).subscriberCount).to.be.equal(0)
    })
  })
})
