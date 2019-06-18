'use strict'

const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../../../src/config')
const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const crypt = require('../../../src/utils/crypt')

describe('Util: Crypt', () => {
  describe('generateAccessToken()', () => {
    const userId = generate.chance.integer()

    it('returns valid JSON Web Token', () => {
      const accessToken = crypt.generateAccessToken(userId)

      const payload = jwt.decode(accessToken)
      expect(payload).to.be.an('object')
    })

    it('returns JSON Web Token with expected payload', () => {
      const accessToken = crypt.generateAccessToken(userId)

      const payload = jwt.decode(accessToken)
      expect(payload).to.have.property('userId', userId)
    })

    it('respects custom options', () => {
      const accessToken = crypt.generateAccessToken(userId, { issuer: 'testingIssuer' })

      const payload = jwt.decode(accessToken)
      expect(payload).to.have.property('iss', 'testingIssuer')
    })

    it('does not overwrite default options', () => {
      const accessToken = crypt.generateAccessToken(userId, { issuer: 'testingIssuer' })

      const payload = jwt.decode(accessToken)
      expect(payload).to.have.property('sub', config.auth.createOptions.subject)
    })
  })

  describe('verifyAccessToken()', () => {
    let userId
    let accessToken

    beforeEach(() => {
      userId = generate.chance.integer()
      accessToken = crypt.generateAccessToken(userId)
    })

    it('returns payload', () => {
      const payload = crypt.verifyAccessToken(accessToken)

      expect(payload).to.be.an('object')
    })

    it('returns payload with correct userId', () => {
      const payload = crypt.verifyAccessToken(accessToken)

      expect(payload).to.have.property('userId', userId)
    })

    it('handles \'Bearer\' string at the beginning of access token', () => {
      accessToken = `Bearer ${accessToken}`
      const payload = crypt.verifyAccessToken(accessToken)

      expect(payload).to.be.an('object')
    })

    it('throws on invalid signature', () => {
      accessToken = accessToken.slice(0, -2)
      const verifyingProcess = () => {
        crypt.verifyAccessToken(accessToken)
      }

      expect(verifyingProcess).to.throw(jwt.JsonWebTokenError)
    })

    it('throws on invalid subject', () => {
      accessToken = crypt.generateAccessToken(userId, { subject: 'thisIsNotLoginSubject' })
      const verifyingProcess = () => {
        crypt.verifyAccessToken(accessToken)
      }

      expect(verifyingProcess).to.throw(jwt.JsonWebTokenError)
    })

    it('throws on expired token', () => {
      accessToken = crypt.generateAccessToken(userId, { expiresIn: -1 })
      const verifyingProcess = () => {
        crypt.verifyAccessToken(accessToken)
      }

      expect(verifyingProcess).to.throw(jwt.TokenExpiredError)
    })
  })

  describe('hashPassword()', () => {
    let password

    beforeEach(() => {
      password = generate.chance.word()
    })

    it('returns Promise', () => {
      const hashedPasswordPromise = crypt.hashPassword(password)

      expect(hashedPasswordPromise).to.be.a('promise')
    })

    it('resolves to valid bcrypt hash', async () => {
      const hashedPassword = await crypt.hashPassword(password)
      const samePassword = await bcrypt.compare(password, hashedPassword)

      expect(samePassword).to.be.true()
    })

    it('uses correct rounds of hashing', async () => {
      const hashedPassword = await crypt.hashPassword(password)

      const hashRounds = bcrypt.getRounds(hashedPassword)
      expect(hashRounds).to.eql(config.auth.saltRounds)
    })
  })

  describe('comparePasswords()', () => {
    let password
    let hashedPassword

    beforeEach(async () => {
      password = generate.chance.word()
      hashedPassword = await crypt.hashPassword(password)
    })

    it('returns Promise', () => {
      const samePasswordPromise = crypt.comparePasswords(password, hashedPassword)

      expect(samePasswordPromise).to.be.a('promise')
    })

    it('resolves to true on correct password', async () => {
      const samePassword = await crypt.comparePasswords(password, hashedPassword)

      expect(samePassword).to.be.true()
    })

    it('resolves to false on incorrect password', async () => {
      const samePassword = await crypt.comparePasswords(generate.chance.word(), hashedPassword)

      expect(samePassword).to.be.false()
    })
  })

  describe('generateEmailVerificationToken()', () => {
    const userId = generate.chance.integer()
    const email = generate.chance.email()

    it('returns valid JSON Web Token', () => {
      const emailVerificationToken = crypt.generateEmailVerificationToken(userId, email)

      const payload = jwt.decode(emailVerificationToken)
      expect(payload).to.be.an('object')
    })

    it('returns JSON Web Token with expected payload', () => {
      const emailVerificationToken = crypt.generateEmailVerificationToken(userId, email)

      const payload = jwt.decode(emailVerificationToken)
      expect(payload).to.have.property('userId', userId)
      expect(payload).to.have.property('email', email)
    })

    it('returns JSON Web Token with correct subject', () => {
      const emailVerificationToken = crypt.generateEmailVerificationToken(userId, email)

      const payload = jwt.decode(emailVerificationToken)
      expect(payload).to.have.property('sub', 'verifyEmail')
    })
  })

  describe('verifyEmailVerificationToken()', () => {
    const userId = generate.chance.integer()
    const email = generate.chance.email()
    let emailVerificationToken

    beforeEach(() => {
      emailVerificationToken = crypt.generateEmailVerificationToken(userId, email)
    })

    it('returns payload', () => {
      const payload = crypt.verifyEmailVerificationToken(emailVerificationToken)

      expect(payload).to.be.an('object')
    })

    it('returns payload with correct userId and email', () => {
      const payload = crypt.verifyEmailVerificationToken(emailVerificationToken)

      expect(payload).to.have.property('userId', userId)
      expect(payload).to.have.property('email', email)
    })

    it('throws on invalid signature', () => {
      emailVerificationToken = emailVerificationToken.slice(0, -2)
      const verifyingProcess = () => {
        crypt.verifyEmailVerificationToken(emailVerificationToken)
      }

      expect(verifyingProcess).to.throw(jwt.JsonWebTokenError)
    })

    it('throws on invalid subject', () => {
      const originalCreateTokenOptions = _.cloneDeep(config.auth.createEmailVerificationToken)
      config.auth.createEmailVerificationToken.subject = 'notValidSubject'

      emailVerificationToken = crypt.generateEmailVerificationToken(userId, email)

      config.auth.createEmailVerificationToken = originalCreateTokenOptions
      const verifyingProcess = () => {
        crypt.verifyEmailVerificationToken(emailVerificationToken)
      }

      expect(verifyingProcess).to.throw(jwt.JsonWebTokenError)
    })

    it('throws on expired token', () => {
      const originalCreateTokenOptions = _.cloneDeep(config.auth.createEmailVerificationToken)
      config.auth.createEmailVerificationToken.expiresIn = -1

      emailVerificationToken = crypt.generateEmailVerificationToken(userId, email)

      config.auth.createEmailVerificationToken = originalCreateTokenOptions
      const verifyingProcess = () => {
        crypt.verifyEmailVerificationToken(emailVerificationToken)
      }

      expect(verifyingProcess).to.throw(jwt.TokenExpiredError)
    })
  })

  describe('generatePasswordResetToken()', () => {
    const userId = generate.chance.integer()
    const email = generate.chance.email()

    it('returns valid JSON Web Token', () => {
      const passwordResetToken = crypt.generatePasswordResetToken(userId, email)

      const payload = jwt.decode(passwordResetToken)
      expect(payload).to.be.an('object')
    })

    it('returns JSON Web Token with expected payload', () => {
      const passwordResetToken = crypt.generatePasswordResetToken(userId, email)

      const payload = jwt.decode(passwordResetToken)
      expect(payload).to.have.property('userId', userId)
      expect(payload).to.have.property('email', email)
    })

    it('returns JSON Web Token with correct subject', () => {
      const passwordResetToken = crypt.generatePasswordResetToken(userId, email)

      const payload = jwt.decode(passwordResetToken)
      expect(payload).to.have.property('sub', 'resetPassword')
    })
  })

  describe('verifyPasswordResetToken()', () => {
    const userId = generate.chance.integer()
    const email = generate.chance.email()
    let resetPasswordToken

    beforeEach(() => {
      resetPasswordToken = crypt.generatePasswordResetToken(userId, email)
    })

    it('returns payload', () => {
      const payload = crypt.verifyPasswordResetToken(resetPasswordToken)

      expect(payload).to.be.an('object')
    })

    it('returns payload with correct userId and email', () => {
      const payload = crypt.verifyPasswordResetToken(resetPasswordToken)

      expect(payload).to.have.property('userId', userId)
      expect(payload).to.have.property('email', email)
    })

    it('throws on invalid signature', () => {
      resetPasswordToken = resetPasswordToken.slice(0, -2)
      const verifyingProcess = () => {
        crypt.verifyPasswordResetToken(resetPasswordToken)
      }

      expect(verifyingProcess).to.throw(jwt.JsonWebTokenError)
    })

    it('throws on invalid subject', () => {
      const originalCreateTokenOptions = _.cloneDeep(config.auth.createEmailVerificationToken)
      config.auth.createEmailVerificationToken.subject = 'notValidSubject'

      resetPasswordToken = crypt.generateEmailVerificationToken(userId, email)

      config.auth.createEmailVerificationToken = originalCreateTokenOptions
      const verifyingProcess = () => {
        crypt.verifyPasswordResetToken(resetPasswordToken)
      }

      expect(verifyingProcess).to.throw(jwt.JsonWebTokenError)
    })

    it('throws on expired token', () => {
      const originalCreateTokenOptions = _.cloneDeep(config.auth.createEmailVerificationToken)
      config.auth.createEmailVerificationToken.expiresIn = -1

      resetPasswordToken = crypt.generateEmailVerificationToken(userId, email)

      config.auth.createEmailVerificationToken = originalCreateTokenOptions
      const verifyingProcess = () => {
        crypt.verifyPasswordResetToken(resetPasswordToken)
      }

      expect(verifyingProcess).to.throw(jwt.TokenExpiredError)
    })
  })

  describe('generateRefreshToken()', () => {
    it('returns string', () => {
      const refreshToken = crypt.generateRefreshToken()

      expect(refreshToken).to.be.a('string')
    })
  })
})
