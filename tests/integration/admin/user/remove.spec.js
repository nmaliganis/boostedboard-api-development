'use strict'

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const app = require('../../../../src/app').callback()
const { User, Board } = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')
const { resetDb } = require('../../../data/cleaner')
const boardService = require('../../../../src/services/board-service')

describe('Endpoints: /admin/users', () => {
  let admin
  let verifiedUser

  describe('DELETE /admin/users/:userId', () => {
    beforeEach(async () => {
      await resetDb()
      admin = await User.create({ ...generate.user(), role: 'admin' })
      admin.token = await crypt.generateAccessToken(admin.id)

      verifiedUser = await generate.verifiedUser()
      verifiedUser.token = await generate.accessTokenForUser(verifiedUser)

      verifiedUser.boards = await boardService.register(verifiedUser.id, generate.board())
      verifiedUser.boards = verifiedUser.boards.map(board => board.toJSON()) // eslint-disable-line max-nested-callbacks
    })

    it('should delete a user', async () => {
      await supertest(app)
        .delete(`/admin/users/${verifiedUser.id}`)
        .set('Authorization', admin.token)
        .expect(204)
    })

    it('should not delete a user twice', async () => {
      await supertest(app)
        .delete(`/admin/users/${verifiedUser.id}`)
        .set('Authorization', admin.token)
        .expect(204)

      await supertest(app)
        .delete(`/admin/users/${verifiedUser.id}`)
        .set('Authorization', admin.token)
        .expect(404)
    })

    it('should mark the user as deleted, but it shall remain in the DB', async () => {
      await supertest(app)
        .delete(`/admin/users/${verifiedUser.id}`)
        .set('Authorization', admin.token)
        .expect(204)

      const deletedUser = await User.findOne({ where: { id: verifiedUser.id }, paranoid: false })

      expect(deletedUser).not.to.eql(null)
      expect(deletedUser.id).to.eql(verifiedUser.id)
      expect(deletedUser.deletedAt).not.to.eql(null)
    })

    it('should delete user\'s boards when the user is deleted and they shall remain in the DB', async () => {
      const registeredBoard = await Board.findOne({ where: { userId: verifiedUser.id } })

      expect(registeredBoard).not.to.eql(null)
      expect(registeredBoard.userId).to.eql(verifiedUser.id)
      expect(registeredBoard.id).to.eql(verifiedUser.boards[0].id)
      expect(registeredBoard.deletedAt).to.eql(null)

      await supertest(app)
        .delete(`/admin/users/${verifiedUser.id}`)
        .set('Authorization', admin.token)
        .expect(204)

      const deletedUser = await User.findOne({ where: { id: verifiedUser.id }, paranoid: false })

      expect(deletedUser).not.to.eql(null)
      expect(deletedUser.id).to.eql(verifiedUser.id)
      expect(deletedUser.deletedAt).not.to.eql(null)

      const deletedBoard = await Board.findOne({ where: { userId: verifiedUser.id } })

      expect(deletedBoard).to.eql(null)

      const deletedBoardParanoid = await Board.findOne({ where: { userId: verifiedUser.id }, paranoid: false })

      expect(deletedBoardParanoid).not.to.eql(null)
      expect(deletedBoardParanoid.userId).to.eql(verifiedUser.id)
      expect(deletedBoardParanoid.id).to.eql(verifiedUser.boards[0].id)
      expect(deletedBoardParanoid.deletedAt).not.to.eql(null)
    })
  })
})
