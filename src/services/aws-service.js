'use strict'

const AWS = require('aws-sdk')
const uuidV4 = require('uuid/v4')
const superagent = require('superagent')
const mime = require('mime')
const config = require('../config')

const s3config = config.aws.s3

module.exports = {

  /**
   * Returns a signed url which can be used to upload data to S3.
   * @param {String=} contentType - Mime type of the uploading file
   * @returns {String} Signed URL
   */
  signedUrl(contentType) {
    const params = {
      Bucket: s3config.bucketName,
      Key: uuidV4(),
      Expires: s3config.uploadUrlExpiration,
      ContentType: contentType,
      ACL: 'public-read',
    }

    return new AWS.S3().getSignedUrl('putObject', params)
  },

  /**
   * Download file specified by URL and upload it to S3
   * @param {String} fileURL URL from file which should be downloaded
   * @param {String=} contentType Mime type of file, eg. image/jpeg, video/mp4, ... If omitted, is detected from URL
   * @returns {Promise.<string>} URL to uploaded file
   */
  async uploadFileFromURL(fileURL, contentType) {
    const fileRequest = await superagent.get(fileURL).buffer(true)

    const fileKey = uuidV4()
    const detectedContentType = mime.getType(fileURL.replace(/\?.*$/u, ''))

    await new AWS.S3().putObject({
      Bucket: s3config.bucketName,
      Key: fileKey,
      ContentType: contentType || detectedContentType,
      ACL: 'public-read',
      Body: fileRequest.body,
    })
      .promise()

    return `${s3config.baseUrl}/${fileKey}`
  },
}
