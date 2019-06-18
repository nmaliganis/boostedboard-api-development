'use strict'

const sinon = require('sinon')
const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const responses = require('../../../data/responses')
const app = require('../../../../src/app').callback()
const { resetDb } = require('../../../data/cleaner')
const googleAuth = require('../../../../src/utils/google-auth')
const awsService = require('../../../../src/services/aws-service')
const { User } = require('../../../../src/database')

const sandbox = sinon.createSandbox()

describe('Endpoints: /admin/auth', () => {
  beforeEach(resetDb)

  describe('POST /admin/auth/google', () => {
    let googleUser
    let googleIdToken
    let fakeTokenInfo
    let uploadedPictureUrl

    beforeEach(() => {
      googleUser = generate.googleAdminUser()
      googleIdToken = generate.googleLogin().googleIdToken

      fakeTokenInfo = { getPayload: sinon.stub().returns(googleUser) }
      sandbox.stub(googleAuth, 'verifyIdToken').returns(Promise.resolve(fakeTokenInfo))

      uploadedPictureUrl = generate.chance.url()
      sandbox.stub(awsService, 'uploadFileFromURL').resolves(uploadedPictureUrl)
    })

    it('responds with newly created user', async () => {
      const response = await supertest(app)
        .post('/admin/auth/google')
        .send({ googleIdToken })
        .expect(200)

      expect(response.body).to.have.all.keys(responses.auth)
    })

    it('responds with existing user', async () => {
      await User.create({ ...generate.googleAdminUser(), googleId: googleUser.sub, role: 'admin' })

      const response = await supertest(app)
        .post('/admin/auth/google')
        .send({ googleIdToken })
        .expect(200)

      expect(response.body).to.have.all.keys(responses.auth)
    })

    it('responds with error when not all required attributes are in body', async () => {
      await supertest(app)
        .post('/admin/auth/google')
        .send({})
        .expect(400)
    })
  })

  describe('POST /admin/auth/google - regular user', () => {
    let googleUser
    let googleIdToken
    let fakeTokenInfo
    let uploadedPictureUrl

    beforeEach(() => {
      googleUser = generate.googleUser()
      googleIdToken = generate.googleLogin().googleIdToken

      fakeTokenInfo = { getPayload: sinon.stub().returns(googleUser) }
      sandbox.stub(googleAuth, 'verifyIdToken').returns(Promise.resolve(fakeTokenInfo))

      uploadedPictureUrl = generate.chance.url()
      sandbox.stub(awsService, 'uploadFileFromURL').resolves(uploadedPictureUrl)
    })

    it('Returns 403 when user does not have admin role or does not have @boostedboards.com account', async () => {
      await supertest(app)
        .post('/admin/auth/google')
        .send({ googleIdToken })
        .expect(403)
    })
  })

  afterEach(() => sandbox.restore())
})
