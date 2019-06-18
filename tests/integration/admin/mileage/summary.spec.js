'use strict'

const moment = require('moment')
const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const app = require('../../../../src/app').callback()
const { User } = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')
const { resetDb } = require('../../../data/cleaner')
const responses = require('../../../data/responses')
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

  describe('GET /admin/mileage/summary', () => {
    beforeEach(async () => {
      const admin = await User.create({ ...generate.user(), role: 'admin' })
      accessToken = await crypt.generateAccessToken(admin.id)

      await createMileage(200, 200, 2)
      await createMileage(201.6, 1.6, 0)
    })

    it('responds with summary of mileage', async () => {
      const response = await supertest(app)
        .get('/admin/mileage/summary')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body).to.have.all.keys(responses.summary)
    })

    it('responds with correct totals', async () => {
      const response = await supertest(app)
        .get('/admin/mileage/summary')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body.totalCount).to.eql(125)
      expect(response.body.today).to.eql(42)
      expect(response.body.last7days).to.eql(125)
      expect(response.body.last30days).to.eql(125)
    })

    it('responds with error when user is not an admin', async () => {
      const user = await User.create(generate.user())
      accessToken = await crypt.generateAccessToken(user.id)

      await supertest(app)
        .get('/admin/mileage/summary')
        .set('Authorization', accessToken)
        .expect(403)
    })

    it('responds with error when user is not authenticated', async () => {
      await supertest(app)
        .get('/admin/mileage/summary')
        .expect(401)
    })
  })
})
