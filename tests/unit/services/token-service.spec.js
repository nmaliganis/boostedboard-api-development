'use strict'

const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const userService = require('../../../src/services/user-service')
const tokenService = require('../../../src/services/token-service')
const db = require('../../../src/database')

describe('Service: Token', () => {
  let koaRequest

  beforeEach(() => {
    koaRequest = generate.koaRequest()
  })

  describe('assignRefreshToken()', () => {
    let registeredUser

    beforeEach(async () => {
      registeredUser = await userService.register(generate.user())
    })

    it('creates refresh token assigned to user', async () => {
      await tokenService.assignRefreshToken(registeredUser, koaRequest)
      const refreshToken = await db.RefreshToken.findOne({ where: { userId: registeredUser.id } })

      expect(refreshToken).to.not.be.a('null')
    })

    it('creates refresh token with correct user agent and ip', async () => {
      await tokenService.assignRefreshToken(registeredUser, koaRequest)
      const refreshToken = await db.RefreshToken.findOne({ where: { userId: registeredUser.id } })

      expect(refreshToken).to.have.property('userAgent', koaRequest.headers['user-agent'])
      expect(refreshToken).to.have.property('ip', koaRequest.ip)
    })

    it('returns refresh token', async () => {
      const refreshTokenResponse = await tokenService.assignRefreshToken(registeredUser, koaRequest)
      const refreshTokenInstance = await db.RefreshToken.findOne({ where: { userId: registeredUser.id } })

      expect(refreshTokenResponse).to.eql(refreshTokenInstance.token)
    })
  })
})
