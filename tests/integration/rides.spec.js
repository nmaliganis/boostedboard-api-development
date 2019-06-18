'use strict'

const _ = require('lodash')
const supertest = require('supertest')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()


describe('Endpoints: /rides', () => {
  describe('POST /rides', () => {
    let user
    let accessToken
    let generatedRide

    beforeEach(async () => {
      user = await generate.verifiedUser()
      accessToken = await generate.accessTokenForUser(user)
      generatedRide = await generate.rideFromClient(user.id)
    })

    it('returns 201 and created ride', async () => {
      const response = await supertest(app)
        .post('/rides')
        .set('Authorization', accessToken)
        .send(generatedRide)

      expect(response.status).to.eql(201)

      expect(response.body).to.have.property('userId', user.id)
      expect(response.body).to.have.property('boardId', generatedRide.boardId)
      expect(response.body.breadcrumbs).to.eql(generatedRide.breadcrumbs)
    })

    it('allows to create a ride without boardId', async () => {
      delete generatedRide.boardId
      const response = await supertest(app)
        .post('/rides')
        .set('Authorization', accessToken)
        .send(generatedRide)

      expect(response.body).to.have.property('userId', user.id)
      expect(response.body).to.have.property('boardId', null)
      expect(response.body.breadcrumbs).to.eql(generatedRide.breadcrumbs)
    })

    it('returns 401 if not logged in', async () => {
      const response = await supertest(app)
        .post('/rides')
        .send(generatedRide)

      expect(response.status).to.eql(401)
    })
  })

  describe('GET /users/me/rides', () => {
    let user
    let accessToken
    let generatedRides

    before(async () => {
      user = await generate.verifiedUser()
      accessToken = await generate.accessTokenForUser(user)
      generatedRides = await Promise.all(_.times(5, () => generate.rideFromClient(user.id)))
      await Promise.all(generatedRides.map(ride => supertest(app)
        .post('/rides')
        .set('Authorization', accessToken)
        .send(ride)))
    })

    it('returns 200', async () => {
      const response = await supertest(app).get('/users/me/rides').set('Authorization', accessToken)

      expect(response.status).to.eql(200)
    })

    it('returns all rides ordered by start time descending', async () => {
      const response = await supertest(app).get('/users/me/rides').set('Authorization', accessToken)

      expect(response.body.rides).to.have.lengthOf(generatedRides.length)
      expect(response.body.rides).to.eql(_.orderBy(response.body.rides, 'startTime', 'desc'))
    })

    it('returns limited rides', async () => {
      const response = await supertest(app)
        .get('/users/me/rides')
        .set('Authorization', accessToken)
        .query({ limit: 2 })

      expect(response.body.rides).to.have.lengthOf(2)
    })

    it('returns offseted rides', async () => {
      const response = await supertest(app)
        .get('/users/me/rides')
        .set('Authorization', accessToken)
        .query({ offset: 4 })

      expect(response.body.rides).to.have.lengthOf(1)
    })

    it('return statistics', async () => {
      const response = await supertest(app)
        .get('/users/me/rides')
        .set('Authorization', accessToken)

      expect(response.body.stats).to.have.all.keys(['count', 'sumMapDistance', 'sumBoardDistance'])
    })

    it('returns 401 if not logged in', async () => {
      const response = await supertest(app).get('/users/me/rides')

      expect(response.status).to.eql(401)
    })
  })

  describe('POST /rides/:rideId/shared', () => {
    let user
    let accessToken
    let createdRide

    beforeEach(async () => {
      user = await generate.verifiedUser()
      accessToken = await generate.accessTokenForUser(user)
      createdRide = (await supertest(app)
        .post('/rides')
        .set('Authorization', accessToken)
        .send(await generate.rideFromClient(user.id))).body
    })

    it('returns 200 and ride', async () => {
      const response = await supertest(app).post(`/rides/${createdRide.id}/shared`).set('Authorization', accessToken)

      expect(response.status).to.eql(200)
      expect(response.body).to.have.property('id', createdRide.id)
    })

    it('set the ride as set', async () => {
      const response = await supertest(app).post(`/rides/${createdRide.id}/shared`).set('Authorization', accessToken)

      expect(response.body).to.have.property('shared', true)
    })

    it('returns 404 if ride does not exists', async () => {
      const fakeRideId = generate.chance.integer({ min: 900, max: 1000 })
      const response = await supertest(app).post(`/rides/${fakeRideId}/shared`).set('Authorization', accessToken)

      expect(response.status).to.eql(404)
    })

    it('returns 404 if trying to update someone\'s else ride', async () => {
      const strangersRide = (await supertest(app)
        .post('/rides')
        .set('Authorization', await generate.accessTokenForUser(await generate.verifiedUser()))
        .send(await generate.rideFromClient(user.id))).body

      const response = await supertest(app).post(`/rides/${strangersRide.id}/shared`).set('Authorization', accessToken)

      expect(response.status).to.eql(404)
    })

    it('returns 401 if not logged in', async () => {
      const response = await supertest(app).post(`/rides/${createdRide.id}/shared`)

      expect(response.status).to.eql(401)
    })
  })

  describe('DELETE /rides/:rideId', () => {
    let user
    let accessToken
    let createdRide

    beforeEach(async () => {
      user = await generate.verifiedUser()
      accessToken = await generate.accessTokenForUser(user)
      createdRide = (await supertest(app)
        .post('/rides')
        .set('Authorization', accessToken)
        .send(await generate.rideFromClient(user.id))).body
    })

    it('returns 204', async () => {
      const response = await supertest(app).delete(`/rides/${createdRide.id}`).set('Authorization', accessToken)

      expect(response.status).to.eql(204)
    })

    it('removes the ride', async () => {
      await supertest(app).delete(`/rides/${createdRide.id}`).set('Authorization', accessToken)
      const response = await supertest(app).get('/users/me/rides').set('Authorization', accessToken)

      expect(response.body.rides).to.have.lengthOf(0)
    })

    it('returns 404 if ride does not exists', async () => {
      const fakeRideId = generate.chance.integer({ min: 900, max: 1000 })
      const response = await supertest(app).delete(`/rides/${fakeRideId}`).set('Authorization', accessToken)

      expect(response.status).to.eql(404)
    })

    it('returns 404 if trying to remove someone\'s else ride', async () => {
      const strangersRide = (await supertest(app)
        .post('/rides')
        .set('Authorization', await generate.accessTokenForUser(await generate.verifiedUser()))
        .send(await generate.rideFromClient(user.id))).body

      const response = await supertest(app).delete(`/rides/${strangersRide.id}`).set('Authorization', accessToken)

      expect(response.status).to.eql(404)
    })

    it('returns 401 if not logged in', async () => {
      const response = await supertest(app).delete(`/rides/${createdRide.id}`)

      expect(response.status).to.eql(401)
    })
  })
})
