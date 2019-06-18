'use strict'

/* eslint-disable no-process-env */
const mockTransport = require('nodemailer-mock-transport')

module.exports = {
  logging: {
    stdout: {
      enabled: false,
      level: 'info',
    },
  },
  database: {
    options: {
      dialectOptions: {
        ssl: false,
      },
      logging: false,
    },
    connectionString:
      process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/boostedboard-test',
  },
  email: {
    transportOptions: mockTransport(),
  },
  auth: {
    saltRounds: 4,
  },
  aws: {
    sns: {
      androidArn: 'TEST_ANDROID_PLATFORM_ARN',
      iosArn: 'TEST_IOS_PLATFORM_ARN',
      generalTopicArn: 'GENERAL_TOPIC_ARN',
    },
  },
}
