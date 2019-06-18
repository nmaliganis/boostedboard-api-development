'use strict'

module.exports = {
  logging: {
    cloudwatch: {
      enabled: false,
    },
    logRequestBody: process.env.LOG_REQUEST_BODY === 'true',
    logResponseBody: process.env.LOG_RESPONSE_BODY === 'true',
  },
  aws: {
    s3: {
      bucketName: 'boostedboard-production',
      baseUrl: 'https://boostedboard-production.s3.amazonaws.com',
    },
  },
  server: {
    frontendHost: 'boostedboard-web.herokuapp.com',
  },
  database: {
    options: {
      pool: {
        max: 20,
      },
    },
  },
}
