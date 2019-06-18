'use strict'

const bluebird = require('bluebird')
const config = require('../config')
const db = require('../database')
const errors = require('../common/errors')
const log = require('../common/logger')
const firmwareUpdateService = require('./firmware-update-service')

module.exports = {
  async register(userId, board) {
    const conflictBoard = await db.Board.findOne({ where: { serial: board.serial } })
    if (conflictBoard) {
      throw new errors.ConflictError(`The board with serial number ${board.serial} is already registered.`)
    }

    if (await db.Board.count({ where: { userId } }) + 1 > config.app.boardsPerUserLimit) {
      throw new errors.ForbiddenError(`One user can have maximum ${config.app.boardsPerUserLimit} boards registerd.`)
    }

    await db.Board.create({
      ...board,
      userId,
    })

    return db.Board.findAll({ where: { userId } })
  },

  async remove(user, boardId) {
    const removedBoards = await db.Board.destroy({ where: { id: boardId, userId: user.id } })
    if (removedBoards === 0) {
      log.info(`Board ${boardId} is not registered for user ${user.id}`)
      throw new errors.NotFoundError('Board is not registered for given user')
    }

    return db.Board.findAll({ where: { userId: user.id } })
  },

  async removeNotOwn(boardId) {
    const foundBoard = await db.Board.findByPk(boardId)
    if (!foundBoard) {
      log.info(`Board with id ${boardId} to delete was not found.`)
      throw new errors.NotFoundError('Board to delete was not found.')
    }

    const removedBoards = await db.Board.destroy({ where: { id: boardId } })
    if (removedBoards === 0) {
      log.info(`Could not delete board with id ${boardId}.`)
      throw new errors.NotFoundError('Could not delete target board')
    }

    return db.Board.findAll({ where: { userId: foundBoard.userId } })
  },

  async update(userId, boardId, updateData) {
    if (updateData.serial && await db.Board.findOne({ where: { serial: updateData.serial } })) {
      throw new errors.ConflictError(`Board with serial number ${updateData.serial} is already registered`)
    }
    const databaseResult = await db.Board.update(updateData, { where: { id: boardId, userId }, returning: true })
    if (databaseResult[0] === 0) {
      throw new errors.NotFoundError('Board to update was not found.')
    }

    return databaseResult[1][0]
  },

  async findByUserWithFWUpdate(userId) {
    const boards = (await db.Board.findAll({ where: { userId } })).map(board => board.toJSON())
    await bluebird.map(boards, async board => {
      const newFirmware = await firmwareUpdateService.checkForFirmwareUpdate(board.motorDriverSerial, board.firmwareVersion)
      board.firmwareUpdateAvailable = newFirmware
    })
    return boards.filter(board => board.firmwareUpdateAvailable)
  },

  findByUserId(userId) {
    return db.Board.findAll({ where: { userId } })
  },

  countAll() {
    return db.Board.count()
  },
}
