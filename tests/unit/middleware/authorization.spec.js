'use strict'

const sinon = require('sinon')
const db = require('../../../src/database')
const crypt = require('../../../src/utils/crypt')
const errors = require('../../../src/common/errors')
const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const authMiddleware = require('../../../src/middleware/authorization')

describe('Middleware: Authorization', () => {
  let verifiedUser
  let fakeCtx
  let fakeMiddleware

  beforeEach(async () => {
    verifiedUser = await generate.verifiedUser()
    fakeCtx = { headers: { authorization: await crypt.generateAccessToken(verifiedUser.id) }, request: {} }
    fakeMiddleware = sinon.stub().resolves()
  })

  describe('on correct header', () => {
    it('sets ctx.request.user', async () => {
      await authMiddleware(fakeCtx, fakeMiddleware)

      expect(fakeCtx.request.user).to.be.instanceOf(db.User)
    })

    it('executes next middleware', async () => {
      await authMiddleware(fakeCtx, fakeMiddleware)

      expect(fakeMiddleware).to.have.been.calledOnce()
    })
  })

  describe('on incorrect header', () => {
    it('rejects on expired token with AccessTokenExpired error', async () => {
      fakeCtx.headers.authorization = await crypt.generateAccessToken(verifiedUser.id, { expiresIn: -1 })
      const authPromise = authMiddleware(fakeCtx, fakeMiddleware)

      await expect(authPromise).to.be.rejectedWith(errors.AccessTokenExpired)
    })

    it('rejects on invalid token with Unauthorized error', async () => {
      fakeCtx.headers.authorization = fakeCtx.headers.authorization.slice(0, -2)
      const authPromise = authMiddleware(fakeCtx, fakeMiddleware)

      await expect(authPromise).to.be.rejectedWith(errors.UnauthorizedError)
    })
  })
})
