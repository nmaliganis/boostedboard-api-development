'use strict'

module.exports = {
  logging: {
    cloudwatch: {
      enabled: false,
    },
  },
  aws: {
    s3: {
      bucketName: 'boostedboard-staging',
      baseUrl: 'https://boostedboard-staging.s3.amazonaws.com',
    },
  },
  server: {
    frontendHost: 'boostedboards-admin-staging.herokuapp.com',
  },
}
