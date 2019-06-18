'use strict'

const nodemailer = require('nodemailer')
const _ = require('lodash')
const config = require('../../config')
const log = require('../../common/logger')
const templates = require('./templates')

const transporter = nodemailer.createTransport(config.email.transportOptions)

module.exports = {
  transporter,
  async sendByTemplate(templateName, to, variables) {
    const message = templates[templateName](variables)
    const mail = {
      from: config.email.from,
      to,
      subject: message.subject,
      html: message.html,
      attachments: message.attachments,
    }

    try {
      await transporter.sendMail(mail)
      log.info({ email: { templateName, to, variables, mail: _.omit(mail, 'html') } }, 'Email sent')
    } catch (err) {
      log.error({ err }, { email: { templateName, to, variables, mail: _.omit(mail, 'html') } }, 'Email was not sent')
      return false
    }

    return true
  },
}
