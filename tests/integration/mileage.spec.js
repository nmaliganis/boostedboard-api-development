'use strict'

const _ = require('lodash')
const supertest = require('supertest')
const app = require('../../src/app').callback()
const generate = require('../data/generate')
const { expect } = require('../common/chai')
const { Mileage } = require('../../src/database')

describe('Endpoints: /mileage', () => {
  describe('POST /mileage', () => {
    let users

    beforeEach(async () => {
      users = await generate.usersWithBoards()
    })

    it('returns 204 without userId in request body', async () => {
      const response = await supertest(app)
        .post('/mileage')
        .send(_.pick(generate.mileage(users[0].boards[0].serial), [
          'boardId',
          'odometerTotal',
          'odometerDifference',
          'differenceSince',
        ]))

      expect(response.status).to.eql(204)
    })

    it('returns 204 with userId in request body', async () => {
      const data = _.pick(generate.mileage(users[0].boards[0].serial), [
        'boardId',
        'odometerTotal',
        'odometerDifference',
        'differenceSince',
      ])

      const response = await supertest(app)
        .post('/mileage')
        .send({ ...data, userId: users[0].id })

      expect(response.status).to.eql(204)
    })

    it('returns 409 when mileage same combination of boardId and differenceSince is used', async () => {
      const data = _.pick(generate.mileage(users[0].boards[0].serial), [
        'boardId',
        'odometerTotal',
        'odometerDifference',
        'differenceSince',
      ])

      await Mileage.create(data)

      const response = await supertest(app)
        .post('/mileage')
        .send({ ...data, userId: users[0].id })

      expect(response.status).to.eql(409)
    })

    it('returns 204', async () => {
      const response = await supertest(app)
        .post('/mileage')
        .send(_.pick(generate.mileage(users[0].boards[0].serial), ['odometerTotal', 'odometerDifference', 'differenceSince']))

      expect(response.status).to.eql(204)
    })

    it('returns 400', async () => {
      const response = await supertest(app)
        .post('/mileage')
        .send(_.pick(generate.mileage(users[0].boards[0].serial), ['odometerDifference', 'differenceSince']))

      expect(response.status).to.eql(400)
    })

    it('returns 400', async () => {
      const response = await supertest(app)
        .post('/mileage')
        .send(_.pick(generate.mileage(users[0].boards[0].serial), ['odometerTotal', 'differenceSince']))

      expect(response.status).to.eql(400)
    })

    it('returns 400', async () => {
      const response = await supertest(app)
        .post('/mileage')
        .send(_.pick(generate.mileage(users[0].boards[0].serial), ['odometerDifference', 'odometerDifference']))

      expect(response.status).to.eql(400)
    })
  })
})
