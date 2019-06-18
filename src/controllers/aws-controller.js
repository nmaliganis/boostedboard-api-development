'use strict'

const compose = require('koa-compose')
const middleware = require('../middleware')
const schema = require('../validation/schema')
const awsService = require('../services/aws-service')

module.exports = {

  /**
   * Returns a signed url which can be used to upload data to S3.
   * @param {Object} ctx Koa context
   * @returns {Function} Koa middleware
   */
  signedUrl: compose([
    middleware.validation.validateBody(schema.aws.signedUrl),
    ctx => {
      const body = ctx.request.validatedBody

      const signedUrl = awsService.signedUrl(body.contentType)

      // Send response
      ctx.status = 200
      ctx.body = {
        signedUrl,
      }
    },
  ]),
}
