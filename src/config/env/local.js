'use strict'

const mockTransport = require('nodemailer-mock-transport')

module.exports = {
  server: {
    proxy: false,
  },
  concurrency: {
    limit: 10,
  },
  auth: {
    createOptions: {
      // expires in 7 days
      expiresIn: 7 * 24 * 60 * 60,
    },
  },
  database: {
    options: {
      dialectOptions: {
        ssl: false,
      },
    },
  },
  logging: {
    logRequestBody: false,
    logResponseBody: false,
  },
  email: {
    transportOptions: mockTransport(),
  },
}
