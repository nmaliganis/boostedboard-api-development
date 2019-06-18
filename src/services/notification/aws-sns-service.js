'use strict'

const AWS = require('aws-sdk')
const config = require('../../config')

AWS.config.update({
  region: config.aws.sns.region,
  apiVersion: config.aws.sns.apiVersion,
})

module.exports = new AWS.SNS()
