'use strict'

const errors = require('../common/errors')
const { MessageInteraction, User } = require('../database')
const { singleEventForUser } = require('../database/helpers')
const log = require('../common/logger')

module.exports = {
  async interactWithMessage(userId, messageId, messageState) {

    const foundUser = await User.findByPk(userId)

    if (!foundUser) {
      log.info(`User with id ${userId} does not exist.`)
      throw new errors.NotFoundError('Target user does not exist.')
    }

    const idType = Object.keys(messageId)[0]
    const idValue = Object.values(messageId)[0]

    if (idType === 'eventId') {
      const seenEvent = (await singleEventForUser(userId, idValue))[0]
      if (!seenEvent) {
        log.info(`User with id ${userId} cannot see the event with id ${idValue}`)
        throw new errors.NotFoundError('Target cannot see the event')
      }
    }

    const mergedObject = { userId, [idType]: idValue }
    const mergedObjectWithAction = { ...mergedObject, messageState }

    const existingReceipt = await MessageInteraction.findOne({ where: mergedObject })
    if (existingReceipt) {
      if (existingReceipt.messageState === messageState) {
        return
      }

      const updateResult = await MessageInteraction.update({ messageState }, { where: mergedObject, returning: true })
      if (updateResult[0] === 0) {
        log.info(`Failed to update message read receipt for user ${userId} for message ${messageId} to ${messageState}`)
        throw new errors.NotFoundError(`Failed to update message read receipt for the user for to ${messageState}`)
      }
    } else {
      await MessageInteraction.create(mergedObjectWithAction)
    }
  },
}
