'use strict'

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const app = require('../../../../src/app').callback()
const { Board, User } = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')

describe('Endpoints: /admin/boards', () => {
  let accessToken
  let user

  describe('GET /admin/boards/count', () => {
    beforeEach(async () => {
      const admin = await User.create({ ...generate.user(), role: 'admin' })
      accessToken = await crypt.generateAccessToken(admin.id)

      user = await User.create(generate.user())
      await Board.create({ ...generate.board(), userId: user.id })
    })

    it('responds with count of all user profiles', async () => {
      const response = await supertest(app)
        .get('/admin/boards/count')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body).to.have.all.keys(['count'])
      expect(response.body.count).to.be.a('number')
    })

    it('responds with error when user is not an admin', async () => {
      accessToken = await crypt.generateAccessToken(user.id)

      await supertest(app)
        .get('/admin/boards/count')
        .set('Authorization', accessToken)
        .expect(403)
    })

    it('responds with error when an authorization token is missing', async () => {
      await supertest(app)
        .get('/admin/boards/count')
        .expect(401)
    })
  })
})
