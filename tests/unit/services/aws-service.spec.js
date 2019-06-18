'use strict'

const sinon = require('sinon')
const AWS = require('aws-sdk')
const superagent = require('superagent')
const { expect } = require('../../common/chai')
const generate = require('../../data/generate')
const awsService = require('../../../src/services/aws-service')
const config = require('../../../src/config')

describe('Service: AWS', () => {
  describe('getSignedUrl', () => {
    const sandbox = sinon.createSandbox()
    let generatedSignedUrl
    let fakeGetSignedUrl

    beforeEach(() => {
      generatedSignedUrl = generate.chance.url()
      fakeGetSignedUrl = sandbox.stub().returns(generatedSignedUrl)
      sandbox.stub(AWS, 'S3').returns({ getSignedUrl: fakeGetSignedUrl })
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('calls AWS.S3.getSignedUrl() with expected arguments', () => {
      const contentType = generate.awsSignedUrlRequestBody().contentType
      const expectedParameters = {
        Bucket: config.aws.s3.bucketName,
        Expires: config.aws.s3.uploadUrlExpiration,
        ContentType: contentType,
        ACL: 'public-read',
      }

      awsService.signedUrl(contentType)

      expect(fakeGetSignedUrl).to.have.been.calledOnce()
      expect(fakeGetSignedUrl).to.have.been.calledWithMatch('putObject', expectedParameters)
    })

    it('returns URL', () => {
      const signedUrl = awsService.signedUrl()

      expect(signedUrl).to.be.ok().and.to.be.a('string').which.eql(generatedSignedUrl)
    })
  })

  describe('uploadFileFromURL()', () => {
    const sandbox = sinon.createSandbox()
    let fakePutObject
    let fakeBufferOption
    let downloadUrl

    beforeEach(() => {
      fakeBufferOption = sandbox.stub().resolves({ body: Buffer.from('randomText') })
      sandbox.stub(superagent, 'get').returns({ buffer: fakeBufferOption })

      fakePutObject = sandbox.stub().returns({ promise: () => Promise.resolve() })
      sandbox.stub(AWS, 'S3').returns({ putObject: fakePutObject })

      downloadUrl = generate.chance.url()
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('downloads file from requested URL', async () => {
      await awsService.uploadFileFromURL(downloadUrl)

      expect(superagent.get).to.have.been.calledOnce()
      expect(superagent.get).to.have.been.calledWith(downloadUrl)
    })

    it('downloads file to buffer', async () => {
      await awsService.uploadFileFromURL(downloadUrl)

      expect(fakeBufferOption).to.have.been.calledOnce()
    })

    it('calls AWS.S3.putObject with correct Bucket', async () => {
      await awsService.uploadFileFromURL(downloadUrl)

      expect(fakePutObject).to.have.been.calledWithMatch({ Bucket: config.aws.s3.bucketName })
    })

    it('calls AWS.S3.putObject with public-read ACL', async () => {
      await awsService.uploadFileFromURL(downloadUrl)

      expect(fakePutObject).to.have.been.calledWithMatch({ ACL: 'public-read' })
    })

    it('calls AWS.S3.putObject with detected content type', async () => {
      await awsService.uploadFileFromURL(`${downloadUrl}.jpg?name=value`)

      expect(fakePutObject).to.have.been.calledWithMatch({ ContentType: 'image/jpeg' })
    })

    it('returns url', async () => {
      const url = await awsService.uploadFileFromURL(`${downloadUrl}`)

      expect(url).be.a('string').which.is.ok()
    })
  })
})
