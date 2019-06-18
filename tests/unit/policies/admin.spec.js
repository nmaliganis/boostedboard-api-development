'use strict'

const sinon = require('sinon')
const db = require('../../../src/database')
const crypt = require('../../../src/utils/crypt')
const { expect } = require('../../common/chai')
const authorization = require('../../../src/middleware/authorization')
const authenticated = require('../../../src/middleware/authorization')
const { resetDb } = require('../../data/cleaner')
const generate = require('../../data/generate')
const admin = require('../../../src/policies/admin')

const sandbox = sinon.createSandbox()

describe('Policy: Admin', () => {
  let ctx
  let middleware

  beforeEach(() => {
    middleware = sandbox.stub().resolves()
    ctx = { request: {}, response: {} }

    return resetDb()
  })

  it('does not throw an error when users is admin', async () => {
    const user = await db.User.create({ ...generate.user(), role: 'admin' })
    const accessToken = await crypt.generateAccessToken(user.id)

    ctx.headers = { authorization: accessToken }

    try {
      await authorization(ctx, middleware)
      await authenticated(ctx, middleware)
      await admin(ctx, middleware)
    } catch (err) {
      expect.fail()
    }
  })

  it('does throw an error when users is not an admin', async () => {
    const accessToken = await generate.accessToken()
    ctx.headers = { authorization: accessToken }

    try {
      await authorization(ctx, middleware)
      await authenticated(ctx, middleware)
      await admin(ctx, middleware)
      expect.fail()
    } catch (err) {
      expect(err.status).to.eql(403)
    }
  })
})
