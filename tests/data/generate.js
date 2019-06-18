'use strict'

/* eslint-disable camelcase, no-undefined */
const Chance = require('chance')
const _ = require('lodash')
const moment = require('moment')
const geotz = require('geo-tz')
const userService = require('../../src/services/user-service')
const authService = require('../../src/services/auth-service')
const boardService = require('../../src/services/board-service')
const crypt = require('../../src/utils/crypt')

const chance = new Chance()

function boardSerial() {
  const serial = `SS${chance.integer({ min: 100000000, max: 999999999 })}`
  const start = chance.integer({ min: 0, max: 1 })
  return serial.slice(start, start + 9)
}

function location() {
  let result
  let condition = false
  do {
    result = chance.coordinates().split(',').reverse()
      .map(coordinate => parseFloat(coordinate))
    try {
      condition = geotz(result[1], result[0]).length === 0
      /* eslint-disable-next-line no-empty */
    } catch {}
  }
  while (condition)
  return result
}

module.exports = {
  chance,

  user: () => ({
    email: chance.email(),
    password: chance.word({ length: 10 }),
    name: chance.name(),
    weight: chance.integer({ min: 40, max: 180 }),
    height: chance.integer({ min: 40, max: 180 }),
    gender: chance.pickone(['male', 'female', 'other', null]),
    pictureUrl: chance.pickone([chance.url(), null]),
  }),

  contestParticipation: () => ({
    contestId: chance.integer({ min: 0, max: 10 }),
    name: chance.word({ length: 20 }),
    accepted: chance.bool(),
    location: chance.coordinates().split(',').reverse()
      .map(coordinate => parseFloat(coordinate)),
  }),

  boardSerial,
  location,

  board: () => ({
    serial: boardSerial(),
    batterySerial: boardSerial(),
    motorDriverSerial: boardSerial(),
    name: chance.word({ length: 10 }),
    purchaseLocation: chance.pickone(['Boostedboards.com', 'Amazon', 'Best Buy', 'Retail Store', 'Used board', 'Other']),
    firmwareVersion: '2.2.1',
    type: chance.pickone(['single', 'dual', 'dual+', 'plus', 'stealth', 'mini s', 'mini x', 'rev']),
  }),

  boardForUser(userId) {
    return boardService.register(userId, this.board())
  },

  async emailVerificationToken() {
    const generatedUser = this.user()
    const registeredUser = await userService.register(generatedUser)
    return crypt.generateEmailVerificationToken(registeredUser.id, registeredUser.email)
  },

  async verifiedUser() {
    const generatedUser = this.user()
    const user = await userService.register(generatedUser)
    await user.update({ isEmailVerified: true })
    return Object.assign(user, { password: generatedUser.password })
  },

  async accessToken() {
    const user = await this.verifiedUser()
    return this.accessTokenForUser(user)
  },

  async accessTokenForUser(user) {
    const authResponse = await authService.native({ email: user.email, password: user.password }, this.koaRequest())
    return authResponse.accessToken
  },

  async usersWithBoards(userCount = 2, boardsPerUser = 3) {
    const users = []
    await Promise.all(_.times(userCount, async () => {
      const user = await this.verifiedUser()
      user.token = await this.accessTokenForUser(user)
      await Promise.all(_.times(boardsPerUser, async () => {
        user.boards = await boardService.register(user.id, this.board())
        user.boards = user.boards.map(board => board.toJSON())
      }))
      users.push(user)
    }))

    return users
  },

  mileage: (
    boardId = boardSerial(),
    odometerTotal = chance.integer({ min: 500, max: 10000 }),
    odometerDifference = odometerTotal - chance.integer({ min: 0, max: 100 }),
  ) => ({
    boardId,
    odometerTotal,
    odometerDifference,
    differenceSince: moment()
      .subtract(1, 'days')
      .toDate(),
  }),

  koaRequest: () => ({
    headers: {
      'user-agent': 'Unit-test',
    },
    ip: chance.ip(),
  }),

  facebookLogin: () => ({
    facebookAccessToken: chance.apple_token(),
  }),

  facebookUser: () => {
    const firstName = chance.first()
    const lastName = chance.last()

    return {
      email: chance.email(),
      name: `${firstName} ${lastName}`,
      short_name: firstName,
      id: chance.word({ length: 17 }),
      picture: {
        data: {
          is_silhouette: chance.bool(),
          url: chance.url(),
        },
      },
    }
  },

  facebookUserPicture: () => ({
    data: {
      is_silhouette: chance.bool(),
      url: chance.url(),
      width: chance.integer(),
      height: chance.integer(),
    },
  }),

  googleLogin: () => ({
    // eslint-disable-next-line max-len
    googleIdToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImM5ZjdmNmUzYmE5YzA1ZGQ0YzlkMzI4MjBlOTE5YjMyNTZjZDdjOWQifQ.eyJhenAiOiI0MTQzMjI2MTk2MjYtZXYwa21zbnVxaTV0bDhkNHBtcnNzMjU4bDlidjZhcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MTQzMjI2MTk2MjYtZXYwa21zbnVxaTV0bDhkNHBtcnNzMjU4bDlidjZhcnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTY1MTU1MTEyMDMyMTI3MTQ0ODgiLCJhdF9oYXNoIjoiMnRYRDE4OWtaSDdJb3Bua0U5R3FBdyIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsImlhdCI6MTUwNDI4NzYxNCwiZXhwIjoxNTA0MjkxMjE0LCJuYW1lIjoiV2lsbGlhbSBKb2JrbyIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLVFtMVl6SVRnOVZzL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUJjL3YwMmdiakQyZkdZL3M5Ni1jL3Bob3RvLmpwZyIsImdpdmVuX25hbWUiOiJXaWxsaWFtIiwiZmFtaWx5X25hbWUiOiJKb2JrbyIsImxvY2FsZSI6ImVuIn0.L_7hxs_u5-tA8hXOQnK4au4Dd_RuxLxXGOUmFUmYe3ujpFY0okqiHmuu4NHCp2ukYjdSgT_utb8C_iTdcLKw5ndWGZKFl440dO0wUGaYyShUqPA5-koDRQzp0gzuVuf5ySAAg5oPKhbeSm6x9A9zk8Y0MB3mpPeMmIr7THsLx18K1a5pUgi-w6Nrq9F6jz2_9xb_A26WYIqoZSr24TZhVQc1N87is2cR6tYflOvKnBid6pVCsfQyPIDnA12OOBFpayRqc0eswrk6bTJ1mZOG51nWWGK7Sv8_HafNTLXrD5JCheiG5AT2ueo46y7YctP0IU61lTY6Nsw5QPnQmtk53Q',
  }),

  googleUser: options => {
    const givenName = chance.first()
    const familyName = chance.last()

    return {
      sub: chance.word({ length: 21 }),
      email: (options && options.email) || chance.email(),
      email_verified: true,
      name: `${givenName} ${familyName}`,
      given_name: givenName,
      family_name: familyName,
      locale: chance.pick(['en', 'es', 'cs']),
      picture: chance.url(),
    }
  },

  googleAdminUser: () => ({ ...module.exports.googleUser(), email: chance.email({ domain: 'boostedboards.com' }) }),

  awsSignedUrlRequestBody: () => ({
    contentType: chance.pickone(['image/jpeg', 'video/mp4', null, undefined]),
  }),

  async rideFromClient(userId, boardId) {
    if (!userId) {
      userId = (await userService.register(this.user())).id
    }
    if (!boardId) {
      const boards = await this.boardForUser(userId)
      boardId = boards.pop().id
    }

    const startTime = moment(chance.date())
    const duration = chance.integer({ min: 100, max: 400 })

    const breadcrumbs = _.range(duration).map(time => ({
      timestamp: startTime.clone().add(time, 'seconds').toISOString(),
      location: chance.coordinates().split(',').reverse()
        .map(coordinate => parseFloat(coordinate)),
      altitude: chance.floating({ min: -500, max: 10000 }),
      boardSpeed: chance.pickone([null, 0, chance.floating({ min: 0, max: 70 })]),
      boardBatteryRemaining: chance.pickone([null, chance.integer({ min: 0, max: 100 })]),
      boardPowerOutput: chance.pickone([null, 0, chance.floating({ min: 0, max: 70 })]),
      boardMode: chance.pickone([null, 'beginner', 'eco', 'expert', 'pro', 'hyper']),
      alternativeMove: chance.bool(),
    }))

    return {
      boardId,
      startTime: startTime.toISOString(),
      endTime: startTime.clone().add(duration, 'seconds').toISOString(),
      mapDistance: chance.floating({ min: 100, max: 10000 }),
      mapAverageSpeed: chance.floating({ min: 1, max: 70 }),
      boardDistance: chance.floating({ min: 100, max: 10000 }),
      boardAverageSpeed: chance.floating({ min: 1, max: 70 }),
      mapTopSpeed: chance.floating({ min: 1, max: 70 }),
      boardTopSpeed: chance.pickone([null, 0, chance.floating({ min: 0, max: 70 })]),
      odometerStart: chance.pickone([null, 0, chance.floating({ min: 0, max: 70 })]),
      odometerFinish: chance.pickone([null, 0, chance.floating({ min: 0, max: 70 })]),
      breadcrumbs,
    }
  },

  spotFromClient: (coordinates = chance.coordinates()) => ({
    type: chance.pickone(['charging', 'hazard']),
    location: coordinates.split(',').reverse()
      .map(coordinate => parseFloat(coordinate)),
  }),

  city() {
    return {
      name: chance.city(),
      location: location(),
      imageUrl: chance.url(),
    }
  },

  event(cityId, options) {
    let additionalFields
    let startDate = chance.date()
    startDate.setFullYear(startDate.getFullYear() + 1000)

    let endDate = chance.date()
    endDate.setFullYear(endDate.getFullYear() + 1000)

    if (startDate > endDate) {
      [startDate, endDate] = [endDate, startDate]
    }

    if (options && options.includeLink) {
      additionalFields = { ...additionalFields,
        link: {
          text: chance.word(),
          url: chance.url(),
        } }
    }

    return {
      name: chance.word(),
      description: chance.sentence((options && options.descriptionWords) || 30),
      location: chance.street(),
      cityId,
      imageUrl: chance.url(),
      startDate,
      endDate,
      ...additionalFields,
    }
  },
}
