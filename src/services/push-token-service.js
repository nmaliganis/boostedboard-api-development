'use strict'

const bluebird = require('bluebird')
const errors = require('../common/errors')
const db = require('../database')
const log = require('../common/logger')
const notificationService = require('./notification')

module.exports = {
  async checkIfTokenExists(userId, token, deviceId) {
    const existingToken = await db.PushToken.findOne({ where: { token } })
    if (existingToken) {
      if (existingToken.userId !== userId) {
        await existingToken.update({ userId })
        db.SubscriptionArn.update({
          userId,
        }, { where: {
          pushTokenId: existingToken.id,
        } })
      }
      if (deviceId && existingToken.deviceId && existingToken.deviceId !== deviceId) {
        log.info(`Token ${token} is already used with different device.`)
        throw new errors.ConflictError('Token is already used with different device.')
      }
    }
    return existingToken
  },

  getAllPushTokensForUser(userId) {
    return db.PushToken.findAll({ where: { userId } })
  },

  async removeTokenAndUnsubscribe(userId, token) {
    const existingToken = await db.PushToken.findOne({ where: { token, userId } })

    if (!existingToken) {
      log.info(`Token ${token} not found for the user ${userId}`)
      throw new errors.NotFoundError(`Token ${token} not found for the user`)
    }

    const subscriptions = await db.SubscriptionArn.findAll({ where: { pushTokenId: existingToken.id } })
    await bluebird.map(subscriptions, sub => notificationService.unsubscribeFromTopic(sub.arn))
    await db.SubscriptionArn.destroy({ where: { pushTokenId: existingToken.id } })
    await existingToken.destroy()
  },
}
