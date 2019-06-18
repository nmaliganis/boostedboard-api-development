'use strict'

const log = require('../../common/logger')
const db = require('../../database')
const { messaging } = require('./firebase-admin')

exports.sendNotification = async (user, title, body, data) => {
  const payload = {
    notification: {
      title,
      body,
    },
    data,
  }
  const pushTokens = await user.getPushTokens()
  pushTokens.map(async ({ token }) => {
    try {
      const response = await messaging().sendToDevice(token, payload)
      if (response.failureCount > 0) {
        log.error({ results: response.results }, 'Error sending message:')
        await db.PushToken.destroy({ where: { token } })
      }
      log.info({ response }, 'Successfully sent message:')
    } catch (error) {
      log.info(error, 'Error sending message:')
    }
  })
}
