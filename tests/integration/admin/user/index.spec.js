'use strict'

/* eslint-disable max-nested-callbacks */

const supertest = require('supertest')
const { expect } = require('../../../common/chai')
const generate = require('../../../data/generate')
const responses = require('../../../data/responses')
const app = require('../../../../src/app').callback()
const { Board, User } = require('../../../../src/database')
const crypt = require('../../../../src/utils/crypt')
const { resetDb } = require('../../../data/cleaner')

const createUser = (name, email, role = 'user') => User.create({ ...generate.user(), name, email, role })
const createBoard = (userId, serial, name) => Board.create({ userId, serial, name })

describe('Endpoints: /admin/users', () => {
  let accessToken

  beforeEach(resetDb)

  describe('GET /admin/users', () => {
    beforeEach(async () => {
      const user = await createUser('Bob', 'bob@example.com')
      await generate.boardForUser(user.id)

      const admin = await createUser('Admin', 'admin@boostedboards.com', 'admin')
      accessToken = await crypt.generateAccessToken(admin.id)
    })

    it('responds with array of all user profiles', async () => {
      const response = await supertest(app)
        .get('/admin/users')
        .set('Authorization', accessToken)
        .expect(200)

      expect(response.body).to.have.all.keys(['totalCount', 'items'])
      expect(response.body.items).to.be.a('array')
      expect(response.body.items[0]).to.have.all.keys(responses.userWithBoards)
      expect(response.body.items[0].boards).to.be.a('array')
      expect(response.body.items[1].boards.length).to.eql(1)
      expect(response.body.items[1].boards[0]).to.have.all.keys(responses.board)
    })

    it('responds with error when user is not an admin', async () => {
      const user = await User.create(generate.user())
      accessToken = await crypt.generateAccessToken(user.id)

      await supertest(app)
        .get('/admin/users')
        .set('Authorization', accessToken)
        .expect(403)
    })

    it('responds with error when user is not an admin', async () => {
      await supertest(app)
        .get('/admin/users')
        .expect(401)
    })

    context('pagination', () => {
      context('15 users', () => {
        beforeEach(async () => {
          await generate.usersWithBoards(13, 2)
        })

        it('responds with default number of 10 profiles', async () => {
          const response = await supertest(app)
            .get('/admin/users')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.totalCount).to.eql(15)
          expect(response.body.items.length).to.eql(10)
        })

        it('responds with specified number of profiles', async () => {
          const response = await supertest(app)
            .get('/admin/users?offset=0&limit=5')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.totalCount).to.eql(15)
          expect(response.body.items.length).to.eql(5)
        })

        it('responds with remaining number of profiles if offset is to high', async () => {
          const response = await supertest(app)
            .get('/admin/users?offset=13&limit=10')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.totalCount).to.eql(15)
          expect(response.body.items.length).to.eql(2)
        })

        it('responds with 0 profiles if offset is to higher than totalCount', async () => {
          const response = await supertest(app)
            .get('/admin/users?offset=20&limit=10')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.totalCount).to.eql(15)
          expect(response.body.items.length).to.eql(0)
        })
      })

      context('params validation', () => {
        it('responds with 400 error when params are not a numbers', async () => {
          await supertest(app)
            .get('/admin/users?offset=foo&limit=bar')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when limit is present but offset is not', async () => {
          await supertest(app)
            .get('/admin/users?limit=10')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when offset is present but limit is not', async () => {
          await supertest(app)
            .get('/admin/users?offset=0')
            .set('Authorization', accessToken)
            .expect(400)
        })
      })
    })

    context('sorting', () => {
      context('5 users', () => {
        beforeEach(async () => {
          await createUser('Chris', 'chris@example.com')
          await createUser('David', 'chris@example.com')
          await createUser('Evan', 'evan@example.com')
        })

        it('responds with default ordered profiles by createdAt DESC', async () => {
          const response = await supertest(app)
            .get('/admin/users')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.items.length).to.eql(5)
          expect(response.body.items[0].id).to.eql(5)
          expect(response.body.items[4].id).to.eql(1)
        })

        it('responds with reordered array of profiles', async () => {
          const response = await supertest(app)
            .get('/admin/users?orderColumn=createdAt&orderDirection=asc')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.items.length).to.eql(5)
          expect(response.body.items[0].id).to.eql(1)
          expect(response.body.items[4].id).to.eql(5)
        })

        it('responds with reordered array of profiles by name ascending', async () => {
          const response = await supertest(app)
            .get('/admin/users?orderColumn=name&orderDirection=asc')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.items.length).to.eql(5)
          expect(response.body.items[0].name).to.eql('Admin')
          expect(response.body.items[1].name).to.eql('Bob')
          expect(response.body.items[2].name).to.eql('Chris')
          expect(response.body.items[3].name).to.eql('David')
          expect(response.body.items[4].name).to.eql('Evan')
        })

        it('responds with reordered array of profiles by name descending', async () => {
          const response = await supertest(app)
            .get('/admin/users?orderColumn=name&orderDirection=desc')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.items.length).to.eql(5)
          expect(response.body.items[0].name).to.eql('Evan')
          expect(response.body.items[1].name).to.eql('David')
          expect(response.body.items[2].name).to.eql('Chris')
          expect(response.body.items[3].name).to.eql('Bob')
          expect(response.body.items[4].name).to.eql('Admin')
        })
      })

      context('params validation', () => {
        it('responds with 400 error when params are not a valid strings', async () => {
          await supertest(app)
            .get('/admin/users?orderColumn=1&orderDirection=foo')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when orderColumn is present but orderDirection is not', async () => {
          await supertest(app)
            .get('/admin/users?orderColumn=name')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when orderDirection is present but orderColumn is not', async () => {
          await supertest(app)
            .get('/admin/users?orderDirection=0')
            .set('Authorization', accessToken)
            .expect(400)
        })
      })
    })

    context('searching', () => {
      context('5 users', () => {
        beforeEach(async () => {
          await createUser('Chris', 'chris@example.com')
          const david = await createUser('David', 'chris@example.com')
          await createUser('Evan', 'evan@example.com')

          await createBoard(david.id, 'S123456789', "David's board")
        })

        it('responds with array of profiles matching name search', async () => {
          const response = await supertest(app)
            .get('/admin/users?searchColumn=name&searchQuery=david')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.totalCount).to.eql(1)
          expect(response.body.items.length).to.eql(1)
          expect(response.body.items[0].name).to.eql('David')
        })

        it('responds with array of profiles matching email search', async () => {
          const response = await supertest(app)
            .get('/admin/users?searchColumn=email&searchQuery=boostedboards')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.totalCount).to.eql(1)
          expect(response.body.items.length).to.eql(1)
          expect(response.body.items[0].name).to.eql('Admin')
        })

        it('responds with array of profiles matching board serial search', async () => {
          const response = await supertest(app)
            .get('/admin/users?searchColumn=serial&searchQuery=s123456789')
            .set('Authorization', accessToken)
            .expect(200)

          expect(response.body).to.have.all.keys(['totalCount', 'items'])
          expect(response.body.totalCount).to.eql(1)
          expect(response.body.items.length).to.eql(1)
          expect(response.body.items[0].name).to.eql('David')
        })
      })

      context('params validation', () => {
        it('responds with 400 error when params are not a valid strings', async () => {
          await supertest(app)
            .get('/admin/users?searchColumn=1&searchQuery=foo')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when searchColumn is present but searchQuery is not', async () => {
          await supertest(app)
            .get('/admin/users?searchColumn=name')
            .set('Authorization', accessToken)
            .expect(400)
        })

        it('responds with 400 error when searchQuery is present but searchColumn is not', async () => {
          await supertest(app)
            .get('/admin/users?searchQuery=foo')
            .set('Authorization', accessToken)
            .expect(400)
        })
      })
    })
  })
})
