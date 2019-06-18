'use strict'

const bluebird = require('bluebird')
const errors = require('../common/errors')
const { Board, User, City, Op, sequelize } = require('../database')
const db = require('../database')
const crypt = require('../utils/crypt')
const emailService = require('../services/email')
const utils = require('../utils')
const { defaultFrom, defaultTo, startOfDay, endOfDay } = require('../utils/date')
const { boardSearchQuery, userSearchQuery, SEARCHABLE_BOARD_COLUMNS } = require('../database/helpers')
const log = require('../common/logger')
const notificationService = require('./notification')
const firmwareUpdateService = require('./firmware-update-service')

module.exports = {
  /**
   * Creates user record within database.
   * @param {Object} user - Data of the user.
   * @returns {Object} Database user record.
   */
  async register(user) {
    const conflictEmail = await User.findOne({ where: { email: user.email, password: { [Op.not]: null } } })
    if (conflictEmail) {
      throw new errors.ConflictError('Email address is already registered.')
    }

    return User.create({
      email: user.email,
      password: await crypt.hashPassword(user.password),
      name: user.name,
      isEmailVerified: false,
      role: utils.userRoleFromEmail(user.email),
    })
  },

  /**
   * Delete user in database.
   * @param {Integer} userId - ID of user to delete
   * @param {Boolean} removeUsersBoards - If set to true it deletes also boards the user owns (true by default)
   * @returns {void}
   */
  async remove(userId, removeUsersBoards = true) {
    const existingUser = await db.User.findByPk(userId)
    if (!existingUser) {
      log.info(`User ${userId} was not found.`)
      throw new errors.NotFoundError('Target user was not found.')
    }
    try {
      const subscriptions = await db.SubscriptionArn.findAll({ where: { userId } })
      await bluebird.map(subscriptions, sub => notificationService.unsubscribeFromTopic(sub.arn))
    } catch (err) {
      log.error(err)
      throw new errors.InternalServerError('Failure unsubscribing a user from SNS topics (city subscriptions)')
    }

    try {
      await sequelize.transaction(async transaction => {
        if (removeUsersBoards) {
          await Board.destroy({ where: { userId }, transaction })
        }
        await db.SubscriptionArn.destroy({ where: { userId }, transaction })
        await db.CitySubscription.destroy({ where: { userId }, force: true, transaction })
        await db.RefreshToken.destroy({ where: { userId }, transaction })
        await db.PushToken.destroy({ where: { userId }, transaction })
        await User.destroy({ where: { id: userId }, transaction })
      })
    } catch (err) {
      log.error(err)
      throw new errors.InternalServerError('Failure executing DB transaction - deleting User/City Subscription/Tokens/Subscription')
    }
  },

  /**
   * Update user in database.
   * @param {Integer} userId - ID of user to update
   * @param {Object} updateData - Data of the user.
   * @returns {Object} Database user record.
   */
  async update(userId, updateData) {
    if (updateData.oldPassword && updateData.newPassword) {
      const user = await User.findByPk(userId)
      if (!user) {
        throw new errors.NotFoundError('User to update was not found.')
      }
      if (!user.password) {
        throw new errors.ValidationError('You cannot update password of Google/Facebook user.')
      }
      const correctOldPassword = await crypt.comparePasswords(updateData.oldPassword, user.password)
      if (!correctOldPassword) {
        throw new errors.ValidationError('Wrong old password.')
      }

      updateData.password = await crypt.hashPassword(updateData.newPassword)
      delete updateData.oldPassword
      delete updateData.newPassword
    }

    const databaseResult = await User.update(updateData, { where: { id: userId }, returning: true })

    // If entity was not updated (not even updatedAt), throw an error
    if (databaseResult[0] === 0) {
      throw new errors.NotFoundError('User to update was not found.')
    }

    return databaseResult[1][0]
  },

  /**
   * Send user email with link to reset password
   * @param {String} email Email of user whom to reset password
   * @returns {Promise.<boolean>} Returns true if everything pass, else throws error
   */
  async requestPasswordReset(email) {
    const user = await User.findOne({ where: { email, password: { [Op.not]: null } } })
    if (!user) {
      const nonNativeUser = await User.findOne({ where: { email } })
      if (nonNativeUser && nonNativeUser.facebookId) {
        throw new errors.ValidationError('Please use your Facebook account to log in.')
      }
      if (nonNativeUser && nonNativeUser.googleId) {
        throw new errors.ValidationError('Please use your Google account to log in.')
      }
      throw new errors.NotFoundError('User was not found.')
    }

    if (user && !user.isEmailVerified) {
      throw new errors.UnauthorizedError('The email address is not verified, check your inbox please.')
    }

    const resetPasswordLink = utils.generatePasswordResetLink(user.id, user.email)
    await emailService.sendByTemplate('resetPassword', user.email, { link: resetPasswordLink })

    return true
  },

  /**
   * Change user's forgotten password
   * @param {String} passwordResetToken token from received email
   * @param {String} newPassword new password to set the user
   * @return {Promise<boolean>} Returns true if everything pass, else throws error
   */
  async confirmPasswordReset(passwordResetToken, newPassword) {
    const payload = crypt.verifyPasswordResetToken(passwordResetToken)

    const password = await crypt.hashPassword(newPassword)
    const updateResult = await User.update({ password }, { where: { id: payload.userId, email: payload.email } })
    if (updateResult[0] === 0) {
      throw new errors.NotFoundError('User was not found.')
    }

    return true
  },

  findByPk(id) {
    return User.findByPk(id)
  },

  async findByPkWithBoards(id) {
    const result = await User.findByPk(id, { include: [
      Board, {
        model: City,
        as: 'subscribedCities',
        through: { attributes: [] },
        // order: [[{ model: City, as: 'subscribedCities' }, 'name', 'ASC']],
      },
    ] })

    const boards = result.boards.map(board => board.toJSON())
    await bluebird.map(boards, async board => {
      const newFirmware = await firmwareUpdateService.checkForFirmwareUpdate(board.motorDriverSerial, board.firmwareVersion)
      board.firmwareUpdateAvailable = newFirmware
    })

    const cities = result.subscribedCities.map(city => city.get())
    cities.sort((first, second) => {
      const firstName = first.name
      const secondName = second.name
      if (firstName < secondName) {
        return -1
      }
      if (firstName > secondName) {
        return 1
      }
      return 0
    })
    return { ...result.get(), subscribedCities: cities, boards }
  },

  /**
   * @param {Object} options options for limit counting
   * @param {String} options.from start date for count limit
   * @param {String} options.to end date for count limit
   * @return {Promise<Number>}
   */
  count(options = {}) {
    const from = options.from || defaultFrom()
    const to = options.to || defaultTo()

    return User.count({
      where: {
        createdAt: {
          [Op.gte]: startOfDay(from),
          [Op.lte]: endOfDay(to),
        },
      },
    })
  },

  /**
   * @param {Object} options options for querying
   * @param {string} options.searchColumn column for search
   * @param {string} options.searchQuery query for search
   * @return {Promise<Number>} Returns number selected records
   */
  countAll(options = {}) {
    const searchColumn = options.searchColumn
    const searchQuery = options.searchQuery

    return User.count({
      where: userSearchQuery(searchColumn, searchQuery),
      distinct: true,
      include: [
        {
          model: Board,
          where: boardSearchQuery(searchColumn, searchQuery),
          required: SEARCHABLE_BOARD_COLUMNS.includes(searchColumn),
        },
      ],
    })
  },

  /**
   * @param {Object} options options for querying
   * @param {number} options.limit limit for pagination
   * @param {number} options.offset offset for pagination
   * @param {string} options.orderColumn column for DB order
   * @param {string} options.orderDirection direction for DB order (ASC, DESC)
   * @param {string} options.searchColumn column for search
   * @param {string} options.searchQuery query for search
   * @return {Promise<[Object]>} Returns array of selected records
   */
  findAll(options) {
    const limit = options.limit || 10
    const offset = options.offset || 0

    const orderColumn = options.orderColumn || 'createdAt'
    const orderDirection = options.orderDirection || 'DESC'

    const searchColumn = options.searchColumn
    const searchQuery = options.searchQuery

    return User.scope('admin').findAll({
      where: userSearchQuery(searchColumn, searchQuery),
      include: [
        {
          model: Board.scope('admin'),
          where: boardSearchQuery(searchColumn, searchQuery),
          required: SEARCHABLE_BOARD_COLUMNS.includes(searchColumn),
        },
      ],
      offset,
      limit,
      order: [
        [orderColumn, orderDirection],
      ],
    })
  },
}
