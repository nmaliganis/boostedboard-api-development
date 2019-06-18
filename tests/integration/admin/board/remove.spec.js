'use strict'

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const app = require('../../../../src/app').callback()
const { User } = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')
const { resetDb } = require('../../../data/cleaner')
const boardService = require('../../../../src/services/board-service')

describe('Endpoints: /admin/boards', () => {
  let admin
  let verifiedUser

  describe('DELETE /admin/boards/:boardId', () => {
    beforeEach(async () => {
      await resetDb()
      admin = await User.create({ ...generate.user(), role: 'admin' })
      admin.token = await crypt.generateAccessToken(admin.id)

      verifiedUser = await generate.verifiedUser()
      verifiedUser.token = await generate.accessTokenForUser(verifiedUser)

      await boardService.register(verifiedUser.id, generate.board())
      await boardService.register(verifiedUser.id, generate.board())
      verifiedUser.boards = await boardService.register(verifiedUser.id, generate.board())
      verifiedUser.boards = verifiedUser.boards.map(board => board.toJSON()) // eslint-disable-line max-nested-callbacks
    })

    it('should delete a board', async () => {
      const summaryResponseBefore = await supertest(app)
        .get('/admin/boards/summary')
        .set('Authorization', admin.token)
        .expect(200)

      expect(summaryResponseBefore.body.boardRegistrations).to.exist.and.to.equal(3)

      const deleteResponse = await supertest(app)
        .delete(`/admin/boards/${verifiedUser.boards[2].id}`)
        .set('Authorization', admin.token)
        .expect(200)

      expect(deleteResponse.body).to.have.all.keys(['boards'])
      expect(deleteResponse.body.boards).to.have.length(2)
      const returnedBoardIds = deleteResponse.body.boards.map(board => board.id)
      expect(returnedBoardIds).to.deep.equal([1, 2])

      const summaryResponseAfter = await supertest(app)
        .get('/admin/boards/summary')
        .set('Authorization', admin.token)
        .expect(200)

      expect(summaryResponseAfter.body.boardRegistrations).to.exist.and.to.equal(2)
    })

    it('return 404 when deleting not registered board', async () => {
      await supertest(app)
        .delete('/boards/12345')
        .set('Authorization', admin.token)
        .expect(404)
    })
  })
})
