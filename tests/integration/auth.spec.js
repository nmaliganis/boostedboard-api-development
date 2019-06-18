'use strict'

const _ = require('lodash')
const supertest = require('supertest')
const generate = require('../data/generate')
const { expect } = require('../common/chai')
const userService = require('../../src/services/user-service')
const app = require('../../src/app').callback()
const { User } = require('../../src/database')
const { resetDb } = require('../data/cleaner')
const crypt = require('../../src/utils/crypt')
const cityService = require('../../src/services/city-service')
const citySubscriptionService = require('../../src/services/city-subscription-service')
const stubs = require('./sns-stub.spec')

const pushTokenData = {
  token: 'ABCD',
  deviceId: 'DEV1',
}

const pragueData = {
  name: 'Prague',
  location: [14.42076, 50.08804],
}

function stringifyDates(city) {
  return JSON.parse(JSON.stringify(city))
}

async function registerCity(cityData) {
  return stringifyDates((await cityService.register(cityData)).find(city => city.name === cityData.name).get())
}

describe('Endpoints: /auth', () => {
  describe('POST /auth/native', () => {
    let unverifiedUser
    let verifiedUser

    beforeEach(async () => {
      unverifiedUser = generate.user()
      await userService.register(unverifiedUser)
      unverifiedUser = _.pick(unverifiedUser, ['email', 'password'])
      verifiedUser = _.pick(await generate.verifiedUser(), ['email', 'password'])
    })

    it('returns accessToken and refreshToken on correct password', async () => {
      const response = await supertest(app)
        .post('/auth/native')
        .send(verifiedUser)

      expect(response.body)
        .to.have.property('accessToken')
        .which.is.a('string')
      expect(response.body)
        .to.have.property('refreshToken')
        .which.is.a('string')
      expect(response.body)
        .to.have.property('profile')
        .which.is.a('object')
      expect(response.body.profile)
        .to.have.property('boards')
        .which.is.a('array')
    })

    it('returns 400 on unknown email', async () => {
      verifiedUser.email = 'not-existing@email.com'
      const response = await supertest(app)
        .post('/auth/native')
        .send(verifiedUser)

      expect(response.statusCode).to.eql(404)
    })

    it('returns 401 on wrong password', async () => {
      verifiedUser.password = 'WrongPassword'
      const response = await supertest(app)
        .post('/auth/native')
        .send(verifiedUser)

      expect(response.statusCode).to.eql(401)
    })

    it('returns 401 on unverified email address', async () => {
      const response = await supertest(app)
        .post('/auth/native')
        .send(unverifiedUser)

      expect(response.statusCode).to.eql(401)
    })
  })

  describe('POST /auth/logout', () => {
    let user
    let prague

    beforeEach(async () => {
      await resetDb()
      user = await User.create({ ...generate.user() })
      user.token = await crypt.generateAccessToken(user.id)
      prague = await registerCity(pragueData)
    })

    it('Logs out', async () => {
      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', user.token)
        .send(pushTokenData)
        .expect(204)

      await citySubscriptionService.subscribeUserToCityEvents(user.id, prague.id)

      await supertest(app)
        .post('/auth/logout')
        .send(pushTokenData)
        .set('Authorization', user.token)
        .expect(204)

      expect(stubs.unsubscribeStub.callCount).to.be.equal(1)
    })

    it('Return 404 for non existing token', async () => {
      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', user.token)
        .send(pushTokenData)
        .expect(204)

      await supertest(app)
        .post('/auth/logout')
        .send({ token: 'XFLBMS', deviceId: '1234567890' })
        .set('Authorization', user.token)
        .expect(404)
    })

    it('Can log out user only once', async () => {
      await supertest(app)
        .post('/users/push-token')
        .set('Authorization', user.token)
        .send(pushTokenData)
        .expect(204)

      await supertest(app)
        .post('/auth/logout')
        .send(pushTokenData)
        .set('Authorization', user.token)
        .expect(204)

      await supertest(app)
        .post('/auth/logout')
        .send(pushTokenData)
        .set('Authorization', user.token)
        .expect(404)
    })
  })
})
