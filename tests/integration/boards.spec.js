'use strict'

const _ = require('lodash')
const supertest = require('supertest')
const app = require('../../src/app').callback()
const generate = require('../data/generate')
const { expect } = require('../common/chai')
const boardService = require('../../src/services/board-service')
const db = require('../../src/database')
const config = require('../../src/config')

describe('Endpoints: /boards', () => {
  describe('POST /boards', () => {
    let generatedBoard
    let accessToken

    beforeEach(async () => {
      generatedBoard = generate.board()
      accessToken = await generate.accessToken()
    })

    it('returns 401 on missing authorization', async () => {
      const response = await supertest(app)
        .post('/boards')
        .send(generatedBoard)

      expect(response.status).to.eql(401)
    })

    it('returns 201', async () => {
      const response = await supertest(app)
        .post('/boards')
        .send(generatedBoard)
        .set('Authorization', accessToken)

      expect(response.status).to.eql(201)
    })

    it('returns boards with all properties', async () => {
      generatedBoard = generate.board()
      const response = await supertest(app)
        .post('/boards')
        .send(generatedBoard)
        .set('Authorization', accessToken)

      expect(response.body.boards[0].name).to.eql(generatedBoard.name)
      expect(response.body.boards[0].serial).to.eql(generatedBoard.serial)
      expect(response.body.boards[0].batterySerial).to.eql(generatedBoard.batterySerial)
      expect(response.body.boards[0].motorDriverSerial).to.eql(generatedBoard.motorDriverSerial)
    })

    it('returns list of all registered boards', async () => {
      const response = await supertest(app)
        .post('/boards')
        .send(generatedBoard)
        .set('Authorization', accessToken)

      expect(response.body).to.exist()
      expect(response.body).to.have.keys(['boards'])
      expect(response.body.boards).to.be.an('array')

      expect(response.body.boards[0]).to.include(generatedBoard)

      const generatedBoard2 = _.pick(generate.board(), ['serial', 'name'])
      const response2 = await supertest(app)
        .post('/boards')
        .send(generatedBoard2)
        .set('Authorization', accessToken)

      expect(response2.body.boards).to.have.length(2)
      expect(response2.body.boards[0]).to.include(generatedBoard)
      expect(response2.body.boards[1]).to.include(generatedBoard2)
    })

    it('return 403 when registering too many boards on one user', async () => {
      const user = await generate.verifiedUser()
      _.times(config.app.boardsPerUserLimit, async () => {
        await boardService.register(user.id, generate.board())
      })

      const response = await supertest(app)
        .post('/boards')
        .send(generatedBoard)
        .set('Authorization', await generate.accessTokenForUser(user))

      expect(response.status).to.eql(403)
    })

    it('returns 400 when purchase location is not one of the supported options', async () => {
      await supertest(app)
        .post('/boards')
        .send({ ...generatedBoard, purchaseLocation: 'Amway dealer' })
        .set('Authorization', accessToken)
        .expect(400)
    })
  })

  describe('DELETE /boards', () => {
    let users

    // generate some users with boards
    beforeEach(async () => {
      users = []
      users.push(await generate.verifiedUser())
      users.push(await generate.verifiedUser())

      await Promise.all(users.map(async user => {
        user.token = await generate.accessTokenForUser(user)

        await boardService.register(user.id, generate.board())
        await boardService.register(user.id, generate.board())
        user.boards = await boardService.register(user.id, generate.board())
        user.boards = user.boards.map(board => board.toJSON()) // eslint-disable-line max-nested-callbacks
      }))
    })

    it('return 200', async () => {
      const response = await supertest(app)
        .delete(`/boards/${users[0].boards[0].id}`)
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
    })

    it('return updated list of registered boards without the deleted board', async () => {
      const response = await supertest(app)
        .delete(`/boards/${users[0].boards[0].id}`)
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
      expect(response.body.boards).to.have.length(2)
      const boardIds = _.map(response.body.boards, 'id')
      expect(boardIds).to.not.include(users[0].boards[0].id)
      expect(boardIds).to.include(users[0].boards[1].id)
      expect(boardIds).to.include(users[0].boards[2].id)
    })

    it('should just mark the board as deleted, but the record should remain in db', async () => {
      await supertest(app)
        .delete(`/boards/${users[0].boards[0].id}`)
        .set('Authorization', users[0].token)

      const deletedBoard = await db.Board.findOne({ where: { id: users[0].boards[0].id }, paranoid: false })

      expect(deletedBoard).not.to.eql(null)
      expect(deletedBoard.id).to.eql(users[0].boards[0].id)
      expect(deletedBoard.deletedAt).not.to.eql(null)
    })

    it('returns 404 when deleting not registered board', async () => {
      const response = await supertest(app)
        .delete('/boards/12345')
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(404)
    })

    it('returns 404 when deleting board registered to another user', async () => {
      const response = await supertest(app)
        .delete(`/boards/${users[1].boards[0].id}`)
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(404)
    })

    it('returns 401 on missing authorization', async () => {
      const response = await supertest(app).delete('/boards/123')

      expect(response.status).to.eql(401)
    })

    it('should be possible to add previously deleted board', async () => {
      const responseDelete = await supertest(app)
        .delete(`/boards/${users[0].boards[0].id}`)
        .set('Authorization', users[0].token)

      expect(responseDelete.status).to.eql(200)

      const responseRegister = await supertest(app)
        .post('/boards')
        .send(_.pick(users[0].boards[0], ['name', 'serial']))
        .set('Authorization', users[0].token)

      expect(responseRegister.status).to.eql(201)
    })
  })

  describe('PATCH /boards/:boardId', () => {
    let users

    // generate some users with boards
    beforeEach(async () => {
      users = []
      users.push(await generate.verifiedUser())
      users.push(await generate.verifiedUser())

      await Promise.all(users.map(async user => {
        user.token = await generate.accessTokenForUser(user)

        await boardService.register(user.id, generate.board())
        await boardService.register(user.id, generate.board())
        user.boards = await boardService.register(user.id, generate.board())
        user.boards = user.boards.map(board => board.toJSON()) // eslint-disable-line max-nested-callbacks
      }))
    })

    it('return 200', async () => {
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ name: generate.chance.word({ length: 10 }) })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
    })

    it('return board with updated name', async () => {
      const newName = generate.chance.word({ length: 10 })
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ name: newName })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
      expect(response.body.name).to.eql(newName)
    })

    it('return board with updated serial number and name', async () => {
      const newSerial = generate.boardSerial()
      const newName = generate.chance.word({ length: 10 })
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ serial: newSerial, name: newName })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
      expect(response.body.serial).to.eql(newSerial)
      expect(response.body.name).to.eql(newName)
    })

    it('return board with updated serial number', async () => {
      const newSerial = generate.boardSerial()
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ serial: newSerial })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
      expect(response.body.serial).to.eql(newSerial)
    })

    it('is not posible to update serial number to value used on some other board', async () => {
      const newSerial = users[1].boards[0].serial
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ serial: newSerial })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(409)
    })

    it('return 404 when updating not registered board', async () => {
      const response = await supertest(app)
        .patch('/boards/12345')
        .send({ name: generate.chance.word({ length: 10 }) })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(404)
    })

    it('return 400 when updating invalid field', async () => {
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ randomFieldThatDoesntExist: generate.chance.word({ length: 10 }) })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(400)
    })

    it('return 400 when sending empty update data', async () => {
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({})
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(400)
    })

    it('return 404 when updating board registered to another user', async () => {
      const response = await supertest(app)
        .patch(`/boards/${users[1].boards[0].id}`)
        .send({ name: generate.chance.word({ length: 10 }) })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(404)
    })

    it('return board with updated batterySerial', async () => {
      const newBatterySerial = generate.boardSerial()
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ batterySerial: newBatterySerial })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
      expect(response.body.batterySerial).to.eql(newBatterySerial)
    })

    it('return board with updated motorDriverSerial', async () => {
      const newMotorDriverSerial = generate.boardSerial()
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ motorDriverSerial: newMotorDriverSerial })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
      expect(response.body.motorDriverSerial).to.eql(newMotorDriverSerial)
    })

    it('returns 401 on missing authorization', async () => {
      const response = await supertest(app)
        .patch('/boards/123')
        .send({ name: generate.chance.word({ length: 10 }) })

      expect(response.status).to.eql(401)
    })

    it('return board with updated firmwareVersion', async () => {
      const newFirmwareVersion = '100.5.6'
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ firmwareVersion: newFirmwareVersion })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
      expect(response.body.firmwareVersion).to.eql(newFirmwareVersion)
    })

    it('return board with updated type', async () => {
      const newType = 'unknown'
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ type: newType })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(200)
      expect(response.body.type).to.eql(newType)
    })

    it('return 400 on unrecognised board type', async () => {
      const newType = 'Lime scooter'
      const response = await supertest(app)
        .patch(`/boards/${users[0].boards[0].id}`)
        .send({ type: newType })
        .set('Authorization', users[0].token)

      expect(response.status).to.eql(400)
    })
  })
})
