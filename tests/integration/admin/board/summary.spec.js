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

const createMileage = (boardId, odometerTotal, ago = 0) => mileageService.register({
  boardId,
  odometerTotal,
  odometerDifference: odometerTotal,
  differenceSince: moment().subtract(ago, 'days').toDate(),
})

describe('Endpoints: /admin/boards', () => {
  let accessToken

  beforeEach(resetDb)

  describe('GET /admin/boards/summary', () => {
    beforeEach(async () => {
      const admin = await User.create({ ...generate.user(), role: 'admin' })
      accessToken = await crypt.generateAccessToken(admin.id)

      await Promise.all([
        createMileage('Board1', 200),
        createMileage('Board2', 20, 1),
        createMileage('Board2', 70),
        admin.createBoard(generate.board()),
        admin.createBoard(generate.board()),
        admin.createBoard(generate.board()),
        admin.createBoard(generate.board()),
      ])
    })

    it('responds with summary of users', async () => {
      const response = await supertest(app)
        .get('/admin/boards/summary')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body).to.have.all.keys(responses.boardsSummary)
    })

    it('responds with correct counts', async () => {
      const response = await supertest(app)
        .get('/admin/boards/summary')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body.boardRegistrations).to.eql(4)
      expect(response.body.connectedBoards).to.eql(2)
    })

    it('responds with error when user is not an admin', async () => {
      const user = await User.create(generate.user())
      accessToken = await crypt.generateAccessToken(user.id)

      await supertest(app)
        .get('/admin/boards/summary')
        .set('Authorization', accessToken)
        .expect(403)
    })

    it('responds with error when user is not authenticated', async () => {
      await supertest(app)
        .get('/admin/boards/summary')
        .expect(401)
    })
  })
})
