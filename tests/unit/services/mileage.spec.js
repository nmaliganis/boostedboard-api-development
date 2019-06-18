'use strict'

const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const mileageService = require('../../../src/services/mileage-service')
const db = require('../../../src/database')

describe('Service: Mileage', () => {
  describe('register()', () => {
    let users
    let mileage

    beforeEach(async () => {
      users = await generate.usersWithBoards()
      expect(users)
        .to.be.an('array')
        .that.has.length(2)
      mileage = generate.mileage(users[0].boards[0].serial)
    })

    it('creates a new mileage tracing record in the database', async () => {
      await mileageService.register(mileage)

      const results = await db.Mileage.findAll({ where: { boardId: users[0].boards[0].serial } })

      expect(results).to.have.lengthOf(1)
      expect(results[0].odometerTotal).to.equal(mileage.odometerTotal)
      expect(results[0].odometerDifference).to.equal(mileage.odometerDifference)
      expect(results[0].differenceSince.getTime()).to.equal(mileage.differenceSince.getTime())
    })
  })
})
