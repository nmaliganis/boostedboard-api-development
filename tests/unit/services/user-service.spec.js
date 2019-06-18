'use strict'

const _ = require('lodash')
const sinon = require('sinon')
const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const userService = require('../../../src/services/user-service')
const errors = require('../../../src/common/errors')
const db = require('../../../src/database')
const crypt = require('../../../src/utils/crypt')
const emailService = require('../../../src/services/email')

describe('Service: User', () => {
  describe('register()', () => {
    let generatedUser

    beforeEach(() => {
      generatedUser = generate.user()
    })

    it('creates a new user with correct attributes', async () => {
      const user = await userService.register(generatedUser)

      expect(user.id).to.be.a('number')
      expect(user.email).to.equal(generatedUser.email)
      expect(user.name).to.equal(generatedUser.name)
    })

    it('creates an user with a default role user', async () => {
      const user = await userService.register(generatedUser)

      expect(user.role).to.equal('user')
    })

    it('creates an user with role admin if email is @boostedboards.com', async () => {
      const user = await userService.register({ ...generatedUser, email: 'email@boostedboards.com' })

      expect(user.role).to.equal('admin')
    })

    it('does not allow creating duplicate user', async () => {
      await userService.register(generatedUser)

      await expect(userService.register(generatedUser)).to.be.rejectedWith(errors.ConflictError)
    })
  })

  describe('update()', () => {
    let generatedUser
    let registeredUser
    let dataToUpdate

    beforeEach(async () => {
      dataToUpdate = _.omit(generate.user(), ['email', 'password'])
      generatedUser = generate.user()
      registeredUser = await userService.register(generatedUser)
    })

    it('returns User from database', async () => {
      const user = await userService.update(registeredUser.id, dataToUpdate)

      expect(user).to.be.instanceOf(db.User)
    })

    it('updates user\'s attributes', async () => {
      const user = await userService.update(registeredUser.id, dataToUpdate)

      expect(user).to.have.property('name', dataToUpdate.name)
      expect(user).to.have.property('weight', dataToUpdate.weight)
      expect(user).to.have.property('height', dataToUpdate.height)
      expect(user).to.have.property('gender', dataToUpdate.gender)
    })

    it('updates user\'s password', async () => {
      dataToUpdate.oldPassword = generatedUser.password
      dataToUpdate.newPassword = generate.chance.word({ length: 10 })
      const user = await userService.update(registeredUser.id, _.cloneDeep(dataToUpdate))

      expect(await crypt.comparePasswords(dataToUpdate.newPassword, user.password)).to.be.true()
    })

    it('rejects on incorrect old password', async () => {
      dataToUpdate.oldPassword = `${generatedUser.password}let's.make.this.password.incorrect`
      dataToUpdate.newPassword = generate.chance.word({ length: 10 })
      const user = userService.update(registeredUser.id, dataToUpdate)

      await expect(user).to.be.rejectedWith(errors.ValidationError)
    })

    it('rejects on changing password of google/facebook user', async () => {
      dataToUpdate.oldPassword = generatedUser.password
      dataToUpdate.newPassword = generate.chance.word({ length: 10 })
      await registeredUser.update({ password: null, googleId: 123456 })
      const user = userService.update(registeredUser.id, dataToUpdate)

      await expect(user).to.be.rejectedWith(errors.ValidationError)
    })

    it('does not update other attributes', async () => {
      const user = await userService.update(registeredUser.id, dataToUpdate)

      expect(user).to.have.property('email', registeredUser.email)
    })

    it('rejects on non-existing user', async () => {
      await expect(userService.update(registeredUser.id + 1000, dataToUpdate)).to.be.rejectedWith(errors.NotFoundError)
    })
  })

  describe('requestPasswordReset()', () => {
    const sandbox = sinon.createSandbox()
    let verifiedUser

    beforeEach(async () => {
      verifiedUser = await generate.verifiedUser()
      sandbox.spy(emailService, 'sendByTemplate')
      sandbox.spy(emailService.transporter, 'sendMail')
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('rejects on Facebook user', async () => {
      await verifiedUser.update({ password: null, facebookId: generate.chance.fbid() })
      const result = userService.requestPasswordReset(verifiedUser.email)

      await expect(result).to.be.rejectedWith(errors.ValidationError)
    })

    it('rejects on Google user', async () => {
      await verifiedUser.update({ password: null, googleId: generate.chance.fbid() })
      const result = userService.requestPasswordReset(verifiedUser.email)

      await expect(result).to.be.rejectedWith(errors.ValidationError)
    })

    it('rejects on user not found', async () => {
      const result = userService.requestPasswordReset(generate.chance.email())

      await expect(result).to.be.rejectedWith(errors.NotFoundError)
    })

    it('rejects on unverified email user', async () => {
      await verifiedUser.update({ isEmailVerified: false })
      const result = userService.requestPasswordReset(verifiedUser.email)

      await expect(result).to.be.rejectedWith(errors.UnauthorizedError)
    })

    it('sends email to user', async () => {
      await userService.requestPasswordReset(verifiedUser.email)

      await expect(emailService.sendByTemplate).to.have.been.calledOnce()
    })

    it('sends email to user with correct reset link host', async () => {
      await userService.requestPasswordReset(verifiedUser.email)

      const sentHtml = emailService.transporter.sendMail.getCall(0).args[0].html
      // do NOT use config to get the host here. This is to double check the expected link
      expect(sentHtml).to.include('https://boostedboard-web-development.herokuapp.com/password?token=')
    })

    it('resolves if everything is all right', async () => {
      const result = userService.requestPasswordReset(verifiedUser.email)

      await expect(result).to.be.fulfilled()
    })
  })

  describe('confirmPasswordReset()', () => {
    let verifiedUser
    let newPassword
    let passwordResetToken

    beforeEach(async () => {
      verifiedUser = await generate.verifiedUser()
      newPassword = generate.chance.word({ length: 12 })
      passwordResetToken = crypt.generatePasswordResetToken(verifiedUser.id, verifiedUser.email)
    })

    it('rejects on incorrect resetPasswordToken', async () => {
      passwordResetToken = crypt.generateEmailVerificationToken(verifiedUser.id, verifiedUser.email)
      const result = userService.confirmPasswordReset(passwordResetToken, newPassword)

      await expect(result).to.be.rejected()
    })

    it('change user\'s password', async () => {
      await userService.confirmPasswordReset(passwordResetToken, newPassword)

      await verifiedUser.reload()
      const passwordChanged = await crypt.comparePasswords(newPassword, verifiedUser.password)
      expect(passwordChanged).to.be.true()
    })

    it('resolves if everything is all right', async () => {
      const result = userService.confirmPasswordReset(passwordResetToken, newPassword)

      await expect(result).to.be.fulfilled()
    })
  })
})
