'use strict'

const sinon = require('sinon')
const sns = require('../../src/services/notification/aws-sns-service')

function addPromiseFunction(func) {
  return {
    promise: func,
  }
}

const sandbox = sinon.createSandbox()
const stubs = {}

beforeEach(() => {
  stubs.subscribeStub = sandbox.stub(sns, 'subscribe').callsFake(data => addPromiseFunction(() => ({
    endpointArn: data.TopicArn,
    SubscriptionArn: `${data.TopicArn} ${data.Endpoint}`,
  })))

  stubs.unsubscribeStub = sandbox.stub(sns, 'unsubscribe').callsFake(() => addPromiseFunction(() => {
  }))

  stubs.createPlatformEndpointStub = sandbox.stub(sns, 'createPlatformEndpoint').callsFake(data => addPromiseFunction(() => ({
    EndpointArn: `${data.PlatformApplicationArn} ${data.Token}`,
  })))

  stubs.publishStub = sandbox.stub(sns, 'publish').callsFake(() => addPromiseFunction(() => ({
  })))
})

afterEach(() => {
  sandbox.restore()
})

module.exports = stubs
