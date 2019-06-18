'use strict'

const sinon = require('sinon')
const { expect } = require('../../common/chai')
const authorization = require('../../../src/middleware/authorization')
const { resetDb } = require('../../data/cleaner')
const generate = require('../../data/generate')
const authenticated = require('../../../src/policies/authenticated')

const sandbox = sinon.createSandbox()

describe('Policy: Authenticated', () => {
  let ctx
  let middleware

  beforeEach(() => {
    middleware = sandbox.stub().resolves()
    ctx = { request: {}, response: {} }

    return resetDb()
  })

  it('does not throw an error when users is active', async () => {
    const accessToken = await generate.accessToken()
    ctx.headers = { authorization: accessToken }

    try {
      await authorization(ctx, middleware)
      await authenticated(ctx, middleware)
    } catch (err) {
      expect.fail()
    }
  })

  it('does throw an error when users is not authenticated', async () => {
    ctx.headers = { authorization: '' }

    try {
      await authorization(ctx, middleware)
      await authenticated(ctx, middleware)
      expect.fail()
    } catch (err) {
      expect(err.status).to.eql(401)
    }
  })
})
