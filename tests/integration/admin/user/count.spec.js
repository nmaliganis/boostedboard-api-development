'use strict'

/* eslint-disable max-nested-callbacks */

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const app = require('../../../../src/app').callback()
const { User } = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')
const { resetDb } = require('../../../data/cleaner')

const createUser = (createdAt = new Date(), role = 'user') => User.create({ ...generate.user(), role, createdAt })

describe('Endpoints: /admin/users', () => {
  let accessToken

  beforeEach(resetDb)

  describe('GET /admin/users/count', () => {
    beforeEach(async () => {
      const admin = await createUser(new Date('2017-01-01'), 'admin')
      accessToken = await crypt.generateAccessToken(admin.id)
    })

    it('responds with count of all user profiles', async () => {
      const response = await supertest(app)
        .get('/admin/users/count')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body).to.have.all.keys(['count'])
      expect(response.body.count).to.be.a('number')
    })

    it('responds with error when user is not an admin', async () => {
      const user = await User.create(generate.user())
      accessToken = await crypt.generateAccessToken(user.id)

      await supertest(app)
        .get('/admin/users/count')
        .set('Authorization', accessToken)
        .expect(403)
    })

    it('responds with error when user is not an admin', async () => {
      await supertest(app)
        .get('/admin/users/count')
        .expect(401)
    })

    context('filtering by dates', () => {
      context('5 users', () => {
        beforeEach(async () => {
          await createUser(new Date('2018-01-01'))
          await createUser(new Date('2018-01-01'))
          await createUser(new Date('2018-02-01'))
          await createUser(new Date('2018-02-28'))
        })

        it('responds with count of all users', async () => {
          const response = await supertest(app)
            .get('/admin/users/count')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body.count).to.eql(5)
        })

        it('responds with count of all users registered within from and to', async () => {
          const response = await supertest(app)
            .get('/admin/users/count?from=2018-02-01&to=2018-03-01')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body.count).to.eql(2)
        })

        it('responds with count of all users registered within day', async () => {
          const response = await supertest(app)
            .get('/admin/users/count?from=2018-02-28&to=2018-02-28')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body.count).to.eql(1)
        })

        it('responds with 0 if nobody registered within date interval', async () => {
          const response = await supertest(app)
            .get('/admin/users/count?from=2017-02-28&to=2017-02-28')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body.count).to.eql(0)
        })
      })

      context('params validation', () => {
        it('responds with 400 error when params are not a valid dates', async () => {
          await supertest(app)
            .get('/admin/users/count?from=1&to=foo')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when date is not in expected format', async () => {
          await supertest(app)
            .get('/admin/users/count?from=01/01/2017&to=01/01/2018')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when from is present but to is not', async () => {
          await supertest(app)
            .get('/admin/users/count?from=2018-01-01')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when to is present but from is not', async () => {
          await supertest(app)
            .get('/admin/users/count?to=2018-12-31')
            .set('Authorization', accessToken)
            .expect(400)
        })
      })
    })
  })
})
