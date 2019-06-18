'use strict'

const supertest = require('supertest')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()


describe('Endpoints: /spots', () => {
  describe('POST /spots', () => {
    let user
    let accessToken
    let generatedSpot

    beforeEach(async () => {
      user = await generate.verifiedUser()
      accessToken = await generate.accessTokenForUser(user)
      generatedSpot = await generate.spotFromClient()
    })

    it('returns 201 and created spot', async () => {
      const response = await supertest(app)
        .post('/spots')
        .set('Authorization', accessToken)
        .send(generatedSpot)

      expect(response.status).to.eql(201)
      expect(response.body).to.have.property('id')
      expect(response.body).to.deep.include(generatedSpot)
    })

    it('returns 401 if not logged in', async () => {
      const response = await supertest(app)
        .post('/spots')
        .send(generatedSpot)

      expect(response.status).to.eql(401)
    })
  })

  describe('GET /spots/:spotId', () => {
    let user
    let accessToken
    let createdSpot

    before(async () => {
      user = await generate.verifiedUser()
      accessToken = await generate.accessTokenForUser(user)
      createdSpot = (await supertest(app)
        .post('/spots')
        .set('Authorization', accessToken)
        .send(await generate.spotFromClient())).body
    })

    it('returns 200 and info about spot', async () => {
      const response = await supertest(app).get(`/spots/${createdSpot.id}`)

      expect(response.status).to.eql(200)
      expect(response.body).to.deep.eql(createdSpot)
    })

    it('returns 404 if spot was not found', async () => {
      const fakeSpotId = generate.chance.integer({ min: 900, max: 1000 })
      const response = await supertest(app).get(`/spots/${fakeSpotId}`)

      expect(response.status).to.eql(404)
    })
  })

  describe('GET /spots', () => {
    let user
    let accessToken
    let createdSpot

    before(async () => {
      user = await generate.verifiedUser()
      accessToken = await generate.accessTokenForUser(user)
      createdSpot = (await supertest(app)
        .post('/spots')
        .set('Authorization', accessToken)
        .send(await generate.spotFromClient())).body
    })

    it('returns 200 and array of spots', async () => {
      const response = await supertest(app).get('/spots').query({
        lat: createdSpot.location[1],
        lng: createdSpot.location[0],
        radius: 10,
      })

      expect(response.status).to.eql(200)
      expect(response.body).to.deep.eql([createdSpot])
    })

    it('returns 400 if lat, lng or radius is missing', async () => {
      await Promise.all(['lat', 'lng', 'radius'].map(async propertyToOmit => {
        const query = { lat: createdSpot.location[1], lng: createdSpot.location[0], radius: 10 }
        delete query[propertyToOmit]

        const response = await supertest(app).get('/spots').query(query)
        expect(response.status).to.eql(400)
      }))
    })
  })

  describe('DELETE /spots/:spotId', () => {
    let user
    let accessToken
    let createdSpot

    beforeEach(async () => {
      user = await generate.verifiedUser()
      accessToken = await generate.accessTokenForUser(user)
      createdSpot = (await supertest(app)
        .post('/spots')
        .set('Authorization', accessToken)
        .send(await generate.spotFromClient())).body
    })

    it('returns 204', async () => {
      const response = await supertest(app).delete(`/spots/${createdSpot.id}`).set('Authorization', accessToken)

      expect(response.status).to.eql(204)
    })

    it('returns 404 if spot does not exists', async () => {
      const fakeSpotId = generate.chance.integer({ min: 900, max: 1000 })
      const response = await supertest(app).delete(`/spots/${fakeSpotId}`).set('Authorization', accessToken)

      expect(response.status).to.eql(404)
    })

    it('returns 401 if not logged in', async () => {
      const response = await supertest(app).delete(`/spots/${createdSpot.id}`)

      expect(response.status).to.eql(401)
    })
  })
})
