'use strict'

/* eslint-disable max-nested-callbacks */

const moment = require('moment')
const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const app = require('../../../../src/app').callback()
const { User } = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')
const { resetDb } = require('../../../data/cleaner')
const mileageService = require('../../../../src/services/mileage-service')

const createMileage = (odometerTotal, odometerDifference, ago) => mileageService.register({
  boardId: 'Board123',
  odometerTotal,
  odometerDifference,
  differenceSince: moment().subtract(ago, 'days').toDate(),
})

describe('Endpoints: /admin/mileage', () => {
  let accessToken

  beforeEach(resetDb)

  describe('GET /admin/mileage/sum', () => {
    beforeEach(async () => {
      const admin = await User.create({ ...generate.user(), role: 'admin' })
      accessToken = await crypt.generateAccessToken(admin.id)

      await createMileage(161, 161, 9)
    })

    it('responds with sum of miles', async () => {
      const response = await supertest(app)
        .get('/admin/mileage/sum?from=2018-02-28&to=2018-02-28')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body).to.have.all.keys(['sum'])
      expect(response.body.sum).to.be.a('number')
    })

    it('responds with sum of all miles when params are not present', async () => {
      const response = await supertest(app)
        .get('/admin/mileage/sum')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body).to.have.all.keys(['sum'])
      expect(response.body.sum).to.be.a('number')
      expect(response.body.sum).to.eql(100)
    })

    it('responds with sum of all miles within interval', async () => {
      const from = moment().subtract('30', 'days').format('YYYY-MM-DD')
      const to = moment().format('YYYY-MM-DD')

      const response = await supertest(app)
        .get(`/admin/mileage/sum?from=${from}&to=${to}`)
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body.sum).to.eql(100)
    })

    it('responds with sum of all miles within interval', async () => {
      const from = moment().subtract('0', 'days').format('YYYY-MM-DD')
      const to = moment().format('YYYY-MM-DD')

      const response = await supertest(app)
        .get(`/admin/mileage/sum?from=${from}&to=${to}`)
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body.sum).to.eql(10)
    })

    it('responds with error when user is not an admin', async () => {
      const user = await User.create(generate.user())
      accessToken = await crypt.generateAccessToken(user.id)

      await supertest(app)
        .get('/admin/mileage/sum')
        .set('Authorization', accessToken)
        .expect(403)
    })

    it('responds with error when user is not an admin', async () => {
      await supertest(app)
        .get('/admin/mileage/sum')
        .expect(401)
    })


    it('responds with 400 error when params are not a valid dates', async () => {
      await supertest(app)
        .get('/admin/mileage/sum?from=1&to=foo')
        .set('Authorization', accessToken)
        .expect(400)
    })

    it('responds with 400 error when date is not in expected format', async () => {
      await supertest(app)
        .get('/admin/mileage/sum?from=01/01/2017&to=01/01/2018')
        .set('Authorization', accessToken)
        .expect(400)
    })

    it('responds with 400 error when from is present but to is not', async () => {
      await supertest(app)
        .get('/admin/mileage/sum?from=2018-01-01')
        .set('Authorization', accessToken)
        .expect(400)
    })

    it('responds with 400 error when to is present but from is not', async () => {
      await supertest(app)
        .get('/admin/mileage/sum?to=2018-12-31')
        .set('Authorization', accessToken)
        .expect(400)
    })
  })
})
