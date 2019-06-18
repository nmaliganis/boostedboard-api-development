'use strict'

const supertest = require('supertest')
const sinon = require('sinon')
const AWS = require('aws-sdk')
const { expect } = require('../common/chai')
const generate = require('../data/generate')
const app = require('../../src/app').callback()

describe('Endpoints: /aws', () => {
  describe('POST /aws/signed-url', () => {
    const sandbox = sinon.createSandbox()
    let accessToken
    let awsSignedUrlRequestBody
    let signedUrl

    beforeEach(async () => {
      accessToken = await generate.accessToken()
      signedUrl = generate.chance.url()
      sandbox.stub(AWS, 'S3').returns({ getSignedUrl: () => signedUrl })
      awsSignedUrlRequestBody = generate.awsSignedUrlRequestBody()
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('returns 200', async () => {
      const response = await supertest(app)
        .post('/aws/signed-url')
        .set('Authorization', accessToken)
        .send(awsSignedUrlRequestBody)

      expect(response.status).to.eql(200)
    })

    it('returns URL', async () => {
      const response = await supertest(app)
        .post('/aws/signed-url')
        .set('Authorization', accessToken)
        .send(awsSignedUrlRequestBody)

      expect(response.body).to.have.property('signedUrl', signedUrl)
    })
  })
})
