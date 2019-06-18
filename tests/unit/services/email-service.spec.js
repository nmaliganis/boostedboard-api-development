'use strict'

const sinon = require('sinon')
const { expect } = require('../../common/chai')
const log = require('../../../src/common/logger')
const templates = require('../../../src/services/email/templates')
const email = require('../../../src/services/email')

describe('Service: email', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('transporter', () => {
    it('has sendMail function', () => {
      expect(email.transporter.sendMail).to.be.a('function')
    })
  })

  describe('sendByTemplate()', () => {
    const templateName = 'testingTemplate'
    const templateVariables = { verificationLink: 'http://sk.co/code', user: { firstName: 'Marc' } }
    const toAddress = 'boostedboard-test@mailinator.com'

    beforeEach(() => {
      sandbox.spy(email.transporter, 'sendMail')
      sandbox.spy(log, 'info')
      sandbox.spy(log, 'error')
      templates[templateName] = variables => ({
        subject: `Email for ${variables.user.firstName}`,
        html: `Here is yours verification link: ${variables.verificationLink}`,
      })
    })

    it('returns promise', async () => {
      const result = email.sendByTemplate(templateName, toAddress, templateVariables)
      expect(result).to.be.a('promise')
      await result
    })

    it('sends email to correct address', async () => {
      await email.sendByTemplate(templateName, toAddress, templateVariables)
      expect(email.transporter.sendMail).to.have.been.calledWithMatch({ to: toAddress })
    })

    it('sends email with correct subject', async () => {
      await email.sendByTemplate(templateName, toAddress, templateVariables)
      expect(email.transporter.sendMail).to.have.been.calledWithMatch({
        subject: 'Email for Marc',
      })
    })

    it('sends email with correct html', async () => {
      await email.sendByTemplate(templateName, toAddress, templateVariables)
      expect(email.transporter.sendMail).to.have.been.calledWithMatch({
        html: 'Here is yours verification link: http://sk.co/code',
      })
    })

    it('logs info when email is sent', async () => {
      await email.sendByTemplate(templateName, toAddress, templateVariables)
      expect(log.info).to.have.callCount(1)
    })
  })
})
