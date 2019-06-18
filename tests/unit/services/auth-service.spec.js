'use strict'

/* eslint-disable camelcase */
const sinon = require('sinon')
const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const userService = require('../../../src/services/user-service')
const authService = require('../../../src/services/auth-service')
const awsService = require('../../../src/services/aws-service')
const errors = require('../../../src/common/errors')
const db = require('../../../src/database')
const crypt = require('../../../src/utils/crypt')
const userRoles = require('../../../src/services/user/enums').roles

describe('Service: Auth', () => {
  let koaRequest

  beforeEach(() => {
    koaRequest = generate.koaRequest()
  })

  describe('native()', () => {
    let unverifiedUser
    let verifiedUser

    beforeEach(async () => {
      unverifiedUser = generate.user()
      await userService.register(unverifiedUser)
      verifiedUser = await generate.verifiedUser()
      await generate.boardForUser(verifiedUser.id)
    })

    it('returns profile, accessToken, refreshToken and isNewUser on correct credentials', async () => {
      const authResponse = await authService.native(verifiedUser, koaRequest)

      expect(authResponse)
        .to.be.an('object')
        .with.keys(['profile', 'accessToken', 'refreshToken', 'isNewUser'])
      expect(authResponse.profile).to.be.an.instanceOf(db.User)
      expect(authResponse.profile.boards)
        .to.be.an('array')
        .that.have.length(1)
    })

    it('rejects on non-existing user', async () => {
      verifiedUser.email = 'non-existing@email.com'

      await expect(authService.native(verifiedUser, koaRequest)).to.be.rejectedWith(errors.NotFoundError)
    })

    it('rejects on wrong password', async () => {
      verifiedUser.password = 'WrongPassword'

      await expect(authService.native(verifiedUser, koaRequest)).to.be.rejectedWith(errors.UnauthorizedError)
    })

    it('rejects on user with unverified email address', async () => {
      await expect(authService.native(unverifiedUser, koaRequest)).to.be.rejectedWith(errors.UnauthorizedError)
    })

    it('resolves on user with unverified email address if verification is not required', async () => {
      const authResponse = await authService.native(unverifiedUser, koaRequest, false)

      expect(authResponse)
        .to.be.an('object')
        .with.keys(['profile', 'accessToken', 'refreshToken', 'isNewUser'])
    })
  })

  describe('facebook()', () => {
    const sandbox = sinon.createSandbox()
    let facebookUser
    let facebookUserPicture
    let facebookAccessToken
    let fakeFacebookApi
    let uploadedPictureUrl

    beforeEach(() => {
      facebookUser = generate.facebookUser()
      facebookUserPicture = generate.facebookUserPicture()
      facebookAccessToken = generate.facebookLogin().facebookAccessToken
      fakeFacebookApi = { api: sinon.stub() }
      fakeFacebookApi.api.withArgs('/me').resolves(facebookUser)
      fakeFacebookApi.api.withArgs('/me/picture').resolves(facebookUserPicture)
      authService.facebookApplication.withAccessToken()
      sandbox.stub(authService.facebookApplication, 'withAccessToken').returns(fakeFacebookApi)

      uploadedPictureUrl = generate.chance.url()
      sandbox.stub(awsService, 'uploadFileFromURL').resolves(uploadedPictureUrl)
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('returns profile, accessToken, refreshToken and isNewUser', async () => {
      let authResponse = await authService.facebook(facebookAccessToken, koaRequest)

      expect(authResponse)
        .to.be.an('object')
        .with.keys(['profile', 'accessToken', 'refreshToken', 'isNewUser'])
      expect(authResponse.profile).to.be.an.instanceOf(db.User)
      expect(authResponse.profile).to.have.property('email', facebookUser.email)
      expect(authResponse.profile).to.have.property('facebookId', facebookUser.id)

      await generate.boardForUser(authResponse.profile.id)
      authResponse = await authService.facebook(facebookAccessToken, koaRequest)
      expect(authResponse.profile.boards)
        .to.be.an('array')
        .that.have.length(1)
    })

    it('returns valid accessToken', async () => {
      const authResponse = await authService.facebook(facebookAccessToken, koaRequest)

      const accessTokenPayload = crypt.verifyAccessToken(authResponse.accessToken)
      expect(accessTokenPayload).to.have.property('userId', authResponse.profile.id)
    })

    it('returns isNewUser as true on new user', async () => {
      const authResponse = await authService.facebook(facebookAccessToken, koaRequest)

      expect(authResponse).to.have.property('isNewUser', true)
    })

    it('returns isNewUser as false on returning user', async () => {
      await authService.facebook(facebookAccessToken, koaRequest)
      const authResponse = await authService.facebook(facebookAccessToken, koaRequest)

      expect(authResponse).to.have.property('isNewUser', false)
    })

    it('copies facebook app with facebook access token', async () => {
      await authService.facebook(facebookAccessToken, koaRequest)

      expect(authService.facebookApplication.withAccessToken).to.have.been.calledOnce()
      expect(authService.facebookApplication.withAccessToken).to.have.been.calledWith(facebookAccessToken)
    })

    it("requests '/me' page from facebook API", async () => {
      await authService.facebook(facebookAccessToken, koaRequest)

      expect(fakeFacebookApi.api).to.have.been.calledWith('/me')
    })

    it("requests '/me/picture' page from facebook API when picture is not silhouette", async () => {
      facebookUser.picture.data.is_silhouette = false
      await authService.facebook(facebookAccessToken, koaRequest)

      expect(fakeFacebookApi.api).to.have.been.calledWith('/me/picture')
    })

    it('uses facebook picture if it is not silhouette', async () => {
      facebookUser.picture.data.is_silhouette = false
      const authResponse = await authService.facebook(facebookAccessToken, koaRequest)

      expect(authResponse.profile).to.have.property('pictureUrl', uploadedPictureUrl)
    })

    it('does not use facebook picture if it is silhouette', async () => {
      facebookUser.picture.data.is_silhouette = true
      const authResponse = await authService.facebook(facebookAccessToken, koaRequest)

      expect(authResponse.profile).to.have.property('pictureUrl', null)
    })
  })

  describe('google() - admin', () => {
    const sandbox = sinon.createSandbox()
    let googleUser
    let googleIdToken
    let fakeTokenInfo
    let uploadedPictureUrl

    beforeEach(() => {
      googleUser = generate.googleUser({ email: 'abcd@boostedboards.com' })
      googleIdToken = generate.googleLogin().googleIdToken

      fakeTokenInfo = { getPayload: sinon.stub().returns(googleUser) }
      sandbox.stub(authService.googleOAuthClient, 'verifyIdToken').callsArgWith(1, null, fakeTokenInfo)

      uploadedPictureUrl = generate.chance.url()
      sandbox.stub(awsService, 'uploadFileFromURL').resolves(uploadedPictureUrl)
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('User role is admin when @boostedboards domain email is used for registration', async () => {
      const authResponse = await authService.google(googleIdToken, koaRequest)

      expect(authResponse)
        .to.be.an('object')
        .with.keys(['profile', 'accessToken', 'refreshToken', 'isNewUser'])
      expect(authResponse.profile).to.be.an.instanceOf(db.User)
      expect(authResponse.profile).to.have.property('role', userRoles.ADMIN)
    })
  })

  describe('google()', () => {
    const sandbox = sinon.createSandbox()
    let googleUser
    let googleIdToken
    let fakeTokenInfo
    let uploadedPictureUrl

    beforeEach(() => {
      googleUser = generate.googleUser()
      googleIdToken = generate.googleLogin().googleIdToken

      fakeTokenInfo = { getPayload: sinon.stub().returns(googleUser) }
      sandbox.stub(authService.googleOAuthClient, 'verifyIdToken').callsArgWith(1, null, fakeTokenInfo)

      uploadedPictureUrl = generate.chance.url()
      sandbox.stub(awsService, 'uploadFileFromURL').resolves(uploadedPictureUrl)
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('returns profile, accessToken, refreshToken and isNewUser', async () => {
      let authResponse = await authService.google(googleIdToken, koaRequest)

      expect(authResponse)
        .to.be.an('object')
        .with.keys(['profile', 'accessToken', 'refreshToken', 'isNewUser'])
      expect(authResponse.profile).to.be.an.instanceOf(db.User)
      expect(authResponse.profile).to.have.property('email', googleUser.email)
      expect(authResponse.profile).to.have.property('googleId', googleUser.sub)

      await generate.boardForUser(authResponse.profile.id)
      authResponse = await authService.google(googleIdToken, koaRequest)
      expect(authResponse.profile.boards)
        .to.be.an('array')
        .that.have.length(1)
    })

    it('User role is user by default', async () => {
      const authResponse = await authService.google(googleIdToken, koaRequest)

      expect(authResponse)
        .to.be.an('object')
        .with.keys(['profile', 'accessToken', 'refreshToken', 'isNewUser'])
      expect(authResponse.profile).to.be.an.instanceOf(db.User)
      expect(authResponse.profile).to.have.property('role', userRoles.USER)
    })

    it('returns valid accessToken', async () => {
      const authResponse = await authService.google(googleIdToken, koaRequest)

      const accessTokenPayload = crypt.verifyAccessToken(authResponse.accessToken)
      expect(accessTokenPayload).to.have.property('userId', authResponse.profile.id)
    })

    it('returns isNewUser as true on new user', async () => {
      const authResponse = await authService.google(googleIdToken, koaRequest)

      expect(authResponse).to.have.property('isNewUser', true)
    })

    it('returns isNewUser as false on returning user', async () => {
      await authService.google(googleIdToken, koaRequest)
      const authResponse = await authService.google(googleIdToken, koaRequest)

      expect(authResponse).to.have.property('isNewUser', false)
    })

    it('verifies ID Token in Google Auth Client', async () => {
      await authService.google(googleIdToken, koaRequest)

      expect(authService.googleOAuthClient.verifyIdToken).to.have.been.calledOnce()
      // What a weird way to safely write undefined - void 0
      expect(authService.googleOAuthClient.verifyIdToken).to.have.been.calledWith({ idToken: googleIdToken, audience: void 0 })
    })

    it('decodes payload of ID Token', async () => {
      await authService.google(googleIdToken, koaRequest)

      expect(fakeTokenInfo.getPayload).to.have.been.calledOnce()
    })

    it('does not allow unverified email addresses', async () => {
      // eslint-disable-next-line camelcase
      googleUser.email_verified = false

      await expect(authService.google(googleIdToken, koaRequest)).to.be.rejectedWith(errors.ValidationError)
    })

    it('uses google picture', async () => {
      const authResponse = await authService.google(googleIdToken, koaRequest)

      expect(authResponse.profile).to.have.property('pictureUrl', uploadedPictureUrl)
    })
  })

  describe('refresh()', () => {
    let verifiedUser
    let refreshToken

    beforeEach(async () => {
      verifiedUser = await generate.verifiedUser()
      refreshToken = crypt.generateRefreshToken()
      await verifiedUser.createRefreshToken({ token: refreshToken })
      await generate.boardForUser(verifiedUser.id)
    })

    it('returns profile, accessToken, refreshToken and isNewUser on correct refreshToken', async () => {
      const authResponse = await authService.refresh(refreshToken, koaRequest)

      expect(authResponse)
        .to.be.an('object')
        .with.keys(['profile', 'accessToken', 'refreshToken', 'isNewUser'])
      expect(authResponse.profile).to.be.an.instanceOf(db.User)
      expect(authResponse.profile.id).to.eql(verifiedUser.id)
      expect(authResponse.profile.boards)
        .to.be.an('array')
        .that.have.length(1)
    })

    it('destroys old refreshToken in database', async () => {
      await authService.refresh(refreshToken, koaRequest)
      const oldRefreshToken = await db.RefreshToken.findOne({ where: { token: refreshToken } })

      expect(oldRefreshToken).to.be.a('null')
    })

    it('rejects on incorrect refresh token', async () => {
      refreshToken = 'IncorrectRefreshToken'

      await expect(authService.refresh(refreshToken, koaRequest)).to.be.rejectedWith(errors.NotFoundError)
    })

    it('rejects on unverified user', async () => {
      await verifiedUser.update({ isEmailVerified: false })
      const authResponse = authService.refresh(refreshToken, koaRequest)

      await expect(authResponse).to.be.rejectedWith(errors.UnauthorizedError)
    })
  })
})
