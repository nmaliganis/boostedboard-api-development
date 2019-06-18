'use strict'

const _ = require('lodash')
const supertest = require('supertest')
const sinon = require('sinon')
const jwt = require('jsonwebtoken')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()
const emailService = require('../../src/services/email')
const crypt = require('../../src/utils/crypt')
const config = require('../../src/config')

const HOUR = 60 * 60

describe('Endpoints: /users', () => {
  describe('POST /users', () => {
    const sandbox = sinon.createSandbox()
    let generatedUser

    beforeEach(() => {
      generatedUser = _.pick(generate.user(), ['email', 'password', 'name'])
      sandbox.spy(emailService, 'sendByTemplate')
      sandbox.spy(emailService.transporter, 'sendMail')
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('returns 201', async () => {
      const response = await supertest(app)
        .post('/users')
        .send(generatedUser)

      expect(response.status).to.eql(201)
    })

    it("includes accessToken, refreshToken, isNewUser and user's profile", async () => {
      const response = await supertest(app)
        .post('/users')
        .send(generatedUser)

      expect(response.body).to.exist()
      expect(response.body).to.have.keys(['accessToken', 'refreshToken', 'isNewUser', 'profile'])
      expect(response.body.profile).to.include.keys(['id', 'email'])
    })

    it('returns accessToken with 24 hours validity', async () => {
      const response = await supertest(app)
        .post('/users')
        .send(generatedUser)

      const expireTimestamp = jwt.decode(response.body.accessToken).exp
      const expectedTimestamp = Math.floor(Date.now() / 1000) + (24 * HOUR)

      expect(expireTimestamp)
        .to.be.at.least(expectedTimestamp - 2)
        .and.at.most(expectedTimestamp + 2)
    })

    it('does not include password', async () => {
      const response = await supertest(app)
        .post('/users')
        .send(generatedUser)

      expect(response.body.profile).to.not.include.keys(['password'])
    })

    it('returns that email is not verified', async () => {
      const response = await supertest(app)
        .post('/users')
        .send(generatedUser)

      expect(response.body.profile.isEmailVerified).to.eql(false)
    })

    it('returns 400 when password is missing', async () => {
      delete generatedUser.password
      const response = await supertest(app)
        .post('/users')
        .send(generatedUser, 'password')

      expect(response.status).to.eql(400)
    })

    it('sends email to user', async () => {
      await supertest(app)
        .post('/users')
        .send(generatedUser)

      expect(emailService.sendByTemplate).to.have.been.calledOnce()
    })

    it('sends email to a user with correct link host', async () => {
      await supertest(app)
        .post('/users')
        .send(generatedUser)

      const sentHtml = emailService.transporter.sendMail.getCall(0).args[0].html
      // do NOT use config to get the host here. This is to double check the expected link
      expect(sentHtml).to.include('https://boostedboard-web-development.herokuapp.com/welcome?token=')
    })
  })

  describe('POST /users/verify-email', () => {
    const sandbox = sinon.createSandbox()
    let emailVerificationToken

    beforeEach(async () => {
      emailVerificationToken = await generate.emailVerificationToken()
      sandbox.spy(emailService, 'sendByTemplate')
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('returns 200 on correct emailVerificationToken', async () => {
      const response = await supertest(app)
        .post('/users/verify-email')
        .send({ emailVerificationToken })

      expect(response.status).to.eql(200)
    })

    it("includes accessToken, refreshToken, isNewUser and user's profile", async () => {
      const response = await supertest(app)
        .post('/users/verify-email')
        .send({ emailVerificationToken })

      expect(response.body).to.have.keys(['accessToken', 'refreshToken', 'isNewUser', 'profile'])
      expect(response.body.profile).to.include.keys(['id', 'email'])
    })

    it("sets user's email address as verified", async () => {
      const response = await supertest(app)
        .post('/users/verify-email')
        .send({ emailVerificationToken })

      expect(response.body.profile.isEmailVerified).to.eql(true)
    })

    it('sends user a new email if token is expired', async () => {
      const originalCreateTokenOptions = _.cloneDeep(config.auth.createEmailVerificationToken)
      config.auth.createEmailVerificationToken.expiresIn = -1
      emailVerificationToken = await generate.emailVerificationToken()
      config.auth.createEmailVerificationToken = originalCreateTokenOptions

      await supertest(app)
        .post('/users/verify-email')
        .send({ emailVerificationToken })

      expect(emailService.sendByTemplate).to.have.been.calledOnce()
    })
  })

  describe('GET /users/me', () => {
    let accessToken

    beforeEach(async () => {
      accessToken = await generate.accessToken()
    })

    it('returns 200', async () => {
      const response = await supertest(app)
        .get('/users/me')
        .set('Authorization', accessToken)

      expect(response.status).to.eql(200)
    })

    it("includes user's profile", async () => {
      const response = await supertest(app)
        .get('/users/me')
        .set('Authorization', accessToken)

      expect(response.body)
        .to.have.property('profile')
        .which.is.an('object')

      expect(response.body.profile)
        .to.have.property('boards')
        .which.is.an('array')
    })

    it('returns 401 on missing authorization', async () => {
      const response = await supertest(app).get('/users/me')

      expect(response.status).to.eql(401)
    })
  })

  describe('PATCH /users/me', () => {
    let accessToken
    let dataToUpdate

    beforeEach(async () => {
      accessToken = await generate.accessToken()
      dataToUpdate = _.omit(generate.user(), ['email', 'password'])
    })

    it('returns 200', async () => {
      const response = await supertest(app)
        .patch('/users/me')
        .set('Authorization', accessToken)
        .send(dataToUpdate)

      expect(response.status).to.eql(200)
    })

    it("returns user's profile", async () => {
      const response = await supertest(app)
        .patch('/users/me')
        .set('Authorization', accessToken)
        .send(dataToUpdate)

      expect(response.body)
        .to.have.property('profile')
        .which.is.an('object')

      expect(response.body.profile)
        .to.have.property('boards')
        .which.is.an('array')
    })

    it("updates user's profile", async () => {
      const response = await supertest(app)
        .patch('/users/me')
        .set('Authorization', accessToken)
        .send(dataToUpdate)

      const updatedProfile = response.body.profile
      expect(updatedProfile).to.have.property('name', dataToUpdate.name)
      expect(updatedProfile).to.have.property('weight', dataToUpdate.weight)
      expect(updatedProfile).to.have.property('height', dataToUpdate.height)
      expect(updatedProfile).to.have.property('gender', dataToUpdate.gender)
    })

    it('does not allow gender, which is not listed in validation', async () => {
      dataToUpdate.gender = 'thisIsNotInValidation'

      const response = await supertest(app)
        .patch('/users/me')
        .set('Authorization', accessToken)
        .send(dataToUpdate)

      expect(response.status).to.eql(400)
    })

    it('returns 401 on missing authorization', async () => {
      const response = await supertest(app)
        .patch('/users/me')
        .send(dataToUpdate)

      expect(response.status).to.eql(401)
    })
  })

  describe('POST /users/request-password-reset', () => {
    let verifiedUser

    beforeEach(async () => {
      verifiedUser = await generate.verifiedUser()
    })

    it('returns 204 on verified user', async () => {
      const response = await supertest(app)
        .post('/users/request-password-reset')
        .send({ email: verifiedUser.email })

      expect(response.status).to.eql(204)
    })

    it('returns 404 on unknown email', async () => {
      const response = await supertest(app)
        .post('/users/request-password-reset')
        .send({ email: generate.chance.email() })

      expect(response.status).to.eql(404)
    })
  })

  describe('POST /users/confirm-password-reset', () => {
    let passwordResetToken
    let newPassword

    beforeEach(async () => {
      const verifiedUser = await generate.verifiedUser()
      passwordResetToken = crypt.generatePasswordResetToken(verifiedUser.id, verifiedUser.email)
      newPassword = generate.chance.word({ length: 12 })
    })

    it('returns 204 on correct passwordResetToken', async () => {
      const response = await supertest(app)
        .post('/users/confirm-password-reset')
        .send({ passwordResetToken, newPassword })

      expect(response.status).to.eql(204)
    })
  })
})
