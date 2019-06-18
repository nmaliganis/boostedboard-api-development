'use strict'

const _ = require('lodash')
const sinon = require('sinon')
const errors = require('../../../src/common/errors')
const db = require('../../../src/database')
const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const userService = require('../../../src/services/user-service')
const rideService = require('../../../src/services/ride-service')


describe('Service: Ride', () => {
  const sandbox = sinon.createSandbox()

  afterEach(() => {
    sandbox.restore()
  })

  describe('create()', () => {
    let registeredUser
    let generatedRide

    beforeEach(async () => {
      sandbox.spy(rideService, 'get')
      registeredUser = await userService.register(generate.user())
      generatedRide = await generate.rideFromClient(registeredUser.id)
    })

    it('creates a ride associated to registered users and with all breadcrumbs', async () => {
      const ride = await rideService.create(registeredUser.id, generatedRide)

      expect(ride.userId).to.equal(registeredUser.id)
      expect(ride.boardId).to.equal(generatedRide.boardId)
      expect(ride.breadcrumbs).to.have.lengthOf(generatedRide.breadcrumbs.length)
    })

    it('returns using rideService.get()', async () => {
      const ride = await rideService.create(registeredUser.id, generatedRide)

      expect(rideService.get).to.have.been.calledOnce()
      expect(ride).to.equal(await rideService.get.lastCall.returnValue)
    })

    it('reject on creating a ride with startTime being after endTime', async () => {
      const originalStartTime = generatedRide.startTime
      generatedRide.startTime = generatedRide.endTime
      generatedRide.endTime = originalStartTime

      await expect(rideService.create(registeredUser.id, generatedRide)).to.be.rejected()
    })
  })

  describe('get()', () => {
    let registeredUser
    let createdRide

    beforeEach(async () => {
      registeredUser = await userService.register(generate.user())
      createdRide = await rideService.create(registeredUser.id, await generate.rideFromClient(registeredUser.id))
    })

    it('returns the ride', async () => {
      const ride = await rideService.get({ id: createdRide.id })

      expect(ride).to.be.an('object')
      expect(ride).to.have.property('id', createdRide.id)
    })

    it('returns breadcrumbs in API format', async () => {
      const ride = await rideService.get({ id: createdRide.id })

      const breadcrumb = ride.breadcrumbs[0]
      expect(breadcrumb).to.have.property('timestamp')
      expect(breadcrumb).to.have.property('location').which.is.an('array')
      expect(breadcrumb).to.have.property('altitude').which.is.a('number')
      expect(breadcrumb).to.have.property('boardSpeed')
      expect(breadcrumb).to.have.property('boardBatteryRemaining')
      expect(breadcrumb).to.have.property('boardPowerOutput')
      expect(breadcrumb).to.have.property('boardMode')
    })

    it('rejects with NotFoundError if the ride was not found', async () => {
      await expect(rideService.get({ id: generate.chance.integer({ min: 900, max: 1000 }) }))
        .to.be.rejectedWith(errors.NotFoundError)
    })
  })

  describe('update()', () => {
    let registeredUser
    let createdRide
    let dataToUpdate

    beforeEach(async () => {
      registeredUser = await userService.register(generate.user())
      createdRide = await rideService.create(registeredUser.id, await generate.rideFromClient(registeredUser.id))
      dataToUpdate = _.omit(await generate.rideFromClient(registeredUser.id), ['boardId', 'breadcrumbs'])
      sandbox.spy(rideService, 'get')
    })

    it('returns the updated ride', async () => {
      const ride = await rideService.update({ id: createdRide.id }, dataToUpdate)

      expect(ride).to.be.an('object')
      expect(ride).to.have.property('id', createdRide.id)

      const rideJSON = ride.toJSON()
      rideJSON.startTime = rideJSON.startTime.toISOString()
      rideJSON.endTime = rideJSON.endTime.toISOString()
      expect(rideJSON).to.deep.include(dataToUpdate)
    })

    it('rejects with NotFoundError if the ride was not found', async () => {
      await expect(rideService.update({ id: generate.chance.integer({ min: 900, max: 1000 }) }))
        .to.be.rejectedWith(errors.NotFoundError)
    })

    it('returns using rideService.get()', async () => {
      const ride = await rideService.update({ id: createdRide.id }, dataToUpdate)

      expect(rideService.get).to.have.been.calledOnce()
      expect(ride).to.equal(await rideService.get.lastCall.returnValue)
    })
  })

  describe('getByUser()', () => {
    let registeredUser

    before(async () => {
      registeredUser = await userService.register(generate.user())

      await Promise.all(_.range(4).map(async () => {
        const generatedRide = await generate.rideFromClient(registeredUser.id)
        return rideService.create(registeredUser.id, generatedRide)
      }))
    })

    it('returns all user\'s rides with breadcrumbs', async () => {
      const result = await rideService.getByUser(registeredUser.id)

      expect(result.rides).to.have.lengthOf(4)
    })

    it('returns all user\'s rides ordered by startTime', async () => {
      const result = await rideService.getByUser(registeredUser.id)

      const rides = result.rides
      expect(_.orderBy(rides, 'startTime', 'desc')).to.eql(rides)
    })

    it('returns ride\'s breadcrumbs in API format', async () => {
      const result = await rideService.getByUser(registeredUser.id)

      const breadcrumb = result.rides[0].breadcrumbs[0]
      expect(breadcrumb).to.have.property('timestamp')
      expect(breadcrumb).to.have.property('location').which.is.an('array')
      expect(breadcrumb).to.have.property('altitude').which.is.a('number')
      expect(breadcrumb).to.have.property('boardSpeed')
      expect(breadcrumb).to.have.property('boardBatteryRemaining')
      expect(breadcrumb).to.have.property('boardPowerOutput')
      expect(breadcrumb).to.have.property('boardMode')
    })

    it('applies limit on query', async () => {
      const result = await rideService.getByUser(registeredUser.id, { limit: 2 })

      expect(result.rides).to.have.lengthOf(2)
    })

    it('applies offset on query', async () => {
      const result = await rideService.getByUser(registeredUser.id, { offset: 3 })

      expect(result.rides).to.have.lengthOf(1)
    })

    it('returns correct statistics', async () => {
      const result = await rideService.getByUser(registeredUser.id)

      const stats = result.stats
      const expectedStats = {
        count: 4,
        sumMapDistance: _.sumBy(result.rides, 'mapDistance'),
        sumBoardDistance: _.sumBy(result.rides, 'boardDistance'),
      }

      expect(stats).to.have.property('count').which.is.a('number').eql(expectedStats.count)
      expect(stats).to.have.property('sumMapDistance').which.is.a('number').closeTo(expectedStats.sumMapDistance, 1)
      expect(stats).to.have.property('sumBoardDistance').which.is.a('number').closeTo(expectedStats.sumBoardDistance, 1)
    })
  })

  describe('remove()', () => {
    let registeredUser
    let createdRide

    beforeEach(async () => {
      registeredUser = await userService.register(generate.user())
      createdRide = await rideService.create(registeredUser.id, await generate.rideFromClient(registeredUser.id))
    })

    it('returns null', async () => {
      const response = await rideService.remove(registeredUser.id, createdRide.id)

      expect(response).to.be.a('null')
    })

    it('removes the ride', async () => {
      await rideService.remove(registeredUser.id, createdRide.id)

      await expect(rideService.get({ id: createdRide.id })).to.be.rejectedWith(errors.NotFoundError)
    })

    it('does not remove the breadcrumbs', async () => {
      await rideService.remove(registeredUser.id, createdRide.id)

      const breadcrumbs = await db.Breadcrumb.findAll({ where: { timestamp: createdRide.breadcrumbs.map(bc => bc.timestamp) } })
      expect(breadcrumbs).to.have.lengthOf(createdRide.breadcrumbs.length)
    })

    it('rejects with NotFoundError if the ride was not found', async () => {
      await expect(rideService.remove(registeredUser.id, generate.chance.integer({ min: 900, max: 1000 })))
        .to.be.rejectedWith(errors.NotFoundError)
    })
  })
})
