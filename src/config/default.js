'use strict'

/* eslint-disable no-process-env */
/* eslint-disable max-len */

const AWS = require('aws-sdk')
const pkg = require('../../package')

module.exports = env => ({
  env,
  appName: 'boostedboard-api',
  version: pkg.version,
  appIntentPrefix: 'boostedboards://',
  concurrency: {
    limit: process.env.CONCURRENCY_LIMIT || 10,
  },
  server: {
    proxy: true,
    concurrency: process.env.WEB_CONCURRENCY || 1,
    port: process.env.PORT || 3000,
    maxMemory: process.env.WEB_MEMORY || 512,
    killTimeout: 3000,
    bodyParser: {
      multipart: true,
    },
    cors: {
      origin: '*',
      exposeHeaders: ['Authorization', 'Content-Language', 'Content-Length', 'Content-Type', 'Date', 'ETag'],
      maxAge: 3600,
    },
    frontendHost: 'boostedboard-web-development.herokuapp.com',
  },
  auth: {
    secret: process.env.AUTH_SECRET || 'bI8kxyD+aNM8Vej154BD9SYGSYCalnRK8sS5CGkbSez3s0FR53b1jHO3CohZCmp9hY0HBiyIZF1p1pYnmYOQQZSA',
    saltRounds: 10,
    resetPasswordTokenLength: 20,
    createOptions: {
      // expires in 1h
      expiresIn: process.env.AUTH_EXPIRES_IN || 60 * 60,
      algorithm: 'HS256',
      issuer: `com.strv.boostedboard-api.${env}`,
      subject: 'login',
    },
    verifyOptions: {
      algorithm: 'HS256',
      issuer: `com.strv.boostedboard-api.${env}`,
      subject: 'login',
    },
    createEmailVerificationToken: {
      expiresIn: '5d',
      algorithm: 'HS256',
      issuer: `com.strv.boostedboard-api.${env}`,
      subject: 'verifyEmail',
    },
    createPasswordResetToken: {
      expiresIn: '2d',
      algorithm: 'HS256',
      issuer: `com.strv.boostedboard-api.${env}`,
      subject: 'resetPassword',
    },
    refreshTokenLength: 32,
    minimalPasswordLength: 8,
  },
  database: {
    options: {
      dialectOptions: {
        ssl: true,
      },
      logging: false,
    },
    pool: {
      max: process.env.DATABASE_POOL_MAX || 100,
      min: process.env.DATABASE_POOL_MIN || 0,
      idle: process.env.DATABASE_POOL_IDLE || 20000,
      acquire: process.env.DATABASE_POOL_ACQUIRE || 20000,
    },
    connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/boostedboard',
  },
  limit: {
    unsecured: {
      duration: process.env.LIMIT_UNSECURED_DURATION || 1000 * 60 * 24,
      max: process.env.LIMIT_UNSECURED_MAX || 30,
    },
  },
  logging: {
    stdout: {
      enabled: true,
      level: 'debug',
    },
    cloudwatch: {
      enabled: false,
      options: {
        region: 'us-east-1',
      },
      maxBytePayloadPerLog: 128 * 1024,
    },
    logRequestBody: true,
    logResponseBody: true,
    maximumBodySize: 10 * 1024,
  },
  facebook: {
    sdkOptions: {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      version: 'v2.10',
    },
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  email: {
    from: 'BoostedBoards.com <no-reply@boostedboards.com>',
    transportOptions: {
      SES: new AWS.SES({ apiVersion: '2010-12-01', region: 'us-east-1' }),
    },
  },
  aws: {
    s3: {
      bucketName: 'boostedboard-development',
      baseUrl: 'https://boostedboard-development.s3.amazonaws.com',
      // signedURLs expire in 10 minutes
      uploadUrlExpiration: 10 * 60,
    },
    sns: {
      region: process.env.AWS_SNS_REGION,
      androidArn: process.env.AWS_SNS_ANDROID_ARN,
      iosArn: process.env.AWS_SNS_IOS_ARN,
      apiVersion: process.env.AWS_SNS_API_VERSION || '2010-03-31',
      generalTopicArn: process.env.AWS_SNS_GENERAL_TOPIC_ARN,
    },
  },
  app: {
    boardsPerUserLimit: process.env.BOARDS_PER_USER_LIMIT || 7,
    adminEmailDomain: 'boostedboards.com',
    contest: {
      cities: JSON.parse(process.env.APP_CONTEST_CITIES || '{}'),
      checkAllPoints: process.env.APP_CONTEST_CHECK_ALL_POINTS || false,
    },
    cities: {
      radius: 100000,
      testCity: {
        name: 'TESTCITY',
        location: '0101000020E610000056BB26A4359E2540EB3713D3850C4B40',
        radius: 0,
        timeZone: 'America/Los_Angeles',
        imageUrl: 'https://boostedboard-development.s3.amazonaws.com/5bb3ee8f-6d55-4a6f-9e36-a0161ad3409e',
      },
    },
    events: {
      imageUrlFallback: process.env.EVENT_IMAGE_URL_FALLBACK || 'https://boostedboard-development.s3.amazonaws.com/f1cb5923-b80f-4b80-88c5-258b76a53a6b',
    },
  },
  boostedBackend: {
    authHeader: 'X-BOOSTED-ACCESS',
    secret: process.env.OLD_API_SECTRET_KEY,
    url: 'https://boosted-app.com:9100',
  },
})
