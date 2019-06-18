'use strict'

const sinon = require('sinon')
const errors = require('../../../src/common/errors')
const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const userService = require('../../../src/services/user-service')
const spotService = require('../../../src/services/spot-service')


describe('Service: Spot', () => {
  const sandbox = sinon.createSandbox()

  afterEach(() => {
    sandbox.restore()
  })

  describe('create()', () => {
    let registeredUser
    let generatedSpot

    beforeEach(async () => {
      sandbox.spy(spotService, 'get')
      registeredUser = await userService.register(generate.user())
      generatedSpot = await generate.spotFromClient()
    })

    it('creates a spot associated to registered user', async () => {
      const spot = await spotService.create(registeredUser.id, generatedSpot)

      expect(spot).to.be.an('object')
      expect(spot).to.have.property('userId', registeredUser.id)
    })

    it('returns using spotService.get()', async () => {
      const rides = await spotService.create(registeredUser.id, generatedSpot)

      expect(spotService.get).to.have.been.calledOnce()
      expect(rides).to.equal(await spotService.get.lastCall.returnValue)
    })
  })

  describe('get()', () => {
    let registeredUser
    let createdSpot

    before(async () => {
      registeredUser = await userService.register(generate.user())
      createdSpot = await spotService.create(registeredUser.id, await generate.spotFromClient())
    })

    it('returns spot with location in API format', async () => {
      const spot = await spotService.get(createdSpot.id)

      expect(spot).to.have.property('location').which.is.an('array')
    })

    it('rejects with NotFoundError if the spot was not found', async () => {
      const invalidSpotId = generate.chance.integer({ min: 900, max: 1000 })

      await expect(spotService.get(invalidSpotId)).to.be.rejectedWith(errors.NotFoundError)
    })
  })

  describe('getInRadius()', () => {
    let registeredUser
    let centerPoint
    let radius
    let spotsInRadius
    let spotsOutOfRadius

    before(async () => {
      registeredUser = await userService.register(generate.user())
      centerPoint = { lat: 37.406819, lng: -122.074997 }
      radius = 500
      // coordinates in lat, lng format here
      const coordinatesInRadius = ['37.4082764, -122.0776147', '37.4065378, -122.0777222', '37.4045225, -122.0746894']
      const coordinatesOutOfRadius = ['37.4189964, -122.1332544', '37.3348794, -122.0088383']
      // create spots
      spotsInRadius = await Promise.all(coordinatesInRadius.map(coordinates =>
        spotService.create(registeredUser.id, generate.spotFromClient(coordinates))))
      spotsOutOfRadius = await Promise.all(coordinatesOutOfRadius.map(coordinates =>
        spotService.create(registeredUser.id, generate.spotFromClient(coordinates))))
    })

    it('returns correct spots in radius', async () => {
      const spots = await spotService.getInRadius(centerPoint.lat, centerPoint.lng, radius)

      expect(spots).to.have.lengthOf(spotsInRadius.length)
      spotsInRadius.forEach(spot => {
        expect(spots).to.deep.include(spot)
      })
    })

    it('returns correct spots in radius with specified type', async () => {
      const type = generate.spotFromClient().type
      const spots = await spotService.getInRadius(centerPoint.lat, centerPoint.lng, radius, type)

      spots.forEach(spot => expect(spot).to.have.property('type', type))
    })

    it('does not return spots outside the radius', async () => {
      const spots = await spotService.getInRadius(centerPoint.lat, centerPoint.lng, radius)

      spotsOutOfRadius.forEach(spot => {
        expect(spots).to.not.deep.include(spot)
      })
    })

    it('returns spots with type and coordinates in API format', async () => {
      const spots = await spotService.getInRadius(centerPoint.lat, centerPoint.lng, radius)

      spots.forEach(spot => {
        expect(spot).to.have.property('type').which.is.a('string')
        expect(spot).to.have.property('location').which.is.an('array')
      })
    })

    it('returns empty array if no spots are found', async () => {
      const spots = await spotService.getInRadius(centerPoint.lat, centerPoint.lng, 0)

      expect(spots).to.be.an('array').which.has.lengthOf(0)
    })
  })

  describe('remove()', () => {
    let registeredUser
    let createdSpot

    before(async () => {
      registeredUser = await userService.register(generate.user())
    })

    beforeEach(async () => {
      createdSpot = await spotService.create(registeredUser.id, await generate.spotFromClient())
    })

    it('removes the spot', async () => {
      const spotsRemovedCount = await spotService.remove(registeredUser.id, createdSpot.id)

      expect(spotsRemovedCount).to.eql(1)
      await expect(spotService.get(createdSpot.id)).to.be.rejectedWith(errors.NotFoundError)
    })

    it('rejects with NotFoundError if the spot was not found', async () => {
      await expect(spotService.remove(registeredUser.id, generate.chance.integer({ min: 900, max: 1000 })))
        .to.be.rejectedWith(errors.NotFoundError)
    })
  })
})
