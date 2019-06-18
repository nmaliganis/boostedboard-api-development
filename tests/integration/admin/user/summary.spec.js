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


const createUser = (createdAt = new Date(), role = 'user') => User.create({ ...generate.user(), role, createdAt })
const pastDate = days => moment(new Date()).subtract(days, 'days')

describe('Endpoints: /admin/users', () => {
  let accessToken

  beforeEach(resetDb)

  describe('GET /admin/users/summary', () => {
    beforeEach(async () => {
      const admin = await createUser(new Date('2017-01-01'), 'admin')
      accessToken = await crypt.generateAccessToken(admin.id)

      await createUser(pastDate(50))
      await createUser(pastDate(28))
      const userWithBoards = await createUser(pastDate(16))
      await createUser(pastDate(2))
      await createUser(pastDate(0))

      await userWithBoards.createBoard(generate.board())
    })

    it('responds with summary of users', async () => {
      const response = await supertest(app)
        .get('/admin/users/summary')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body).to.have.all.keys(responses.summary)
    })

    it('responds with correct counts', async () => {
      const response = await supertest(app)
        .get('/admin/users/summary')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body.totalCount).to.eql(6)
      expect(response.body.today).to.eql(1)
      expect(response.body.last7days).to.eql(2)
      expect(response.body.last30days).to.eql(4)
    })

    it('responds with error when user is not an admin', async () => {
      const user = await User.create(generate.user())
      accessToken = await crypt.generateAccessToken(user.id)

      await supertest(app)
        .get('/admin/users/summary')
        .set('Authorization', accessToken)
        .expect(403)
    })

    it('responds with error when user is not authenticated', async () => {
      await supertest(app)
        .get('/admin/users/summary')
        .expect(401)
    })
  })
})
