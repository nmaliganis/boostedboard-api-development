'use strict'

/* eslint-disable camelcase, id-length, max-len */

const crypto = require('crypto')
const request = require('request-promise-native')
const _ = require('lodash')
const config = require('../config')
const log = require('../common/logger')

function randomInt() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
}

function addQueryParamsToUrl(url, queryParams) {
  const queryStrings = []
  for (const property in queryParams) {
    if (queryParams.hasOwnProperty(property)) {
      queryStrings.push(`${property}=${queryParams[property]}`)
    }
  }
  const queries = queryStrings.join('&')
  if (queries === '') {
    return url
  }
  return `${url}?${queries}`
}

function generateHashToken(pathWithQueryParams, secret) {
  const stringToHash = `${secret}${pathWithQueryParams}`
  return crypto.createHash('sha256').update(stringToHash).digest('hex')
}

function compareVersion(first, second) {
  const funcArr = [
    _.isString,
    str => str.split('.').length === 3,
  ]

  // Check for invalid versions (illformated, not a string)
  for (let i = 0; i < funcArr.length; i++) {
    const func = funcArr[i]
    if (!func(first) && !func(second)) {
      return 0
    }
    if (!func(first)) {
      return 1
    }
    if (!func(second)) {
      return -1
    }
  }

  const firstArr = first.split('.')
  const secondArr = second.split('.')

  for (let i = 0; i < 3; i++) {
    const firstStr = firstArr[i]
    const secondStr = secondArr[i]
    const firstNum = parseInt(firstStr)
    const secondNum = parseInt(secondStr)

    if (!isNaN(firstNum) && !isNaN(secondNum)) {
      if (firstNum < secondNum) {
        return 1
      }
      if (firstNum > secondNum) {
        return -1
      }
      if (firstStr !== secondStr && (isNaN(firstStr) || isNaN(secondStr))) {
        if (firstStr < secondStr) {
          return 1
        }
        if (firstStr > secondStr) {
          return -1
        }
      }

    } else {
      if (isNaN(firstNum) && !isNaN(secondNum)) {
        return 1
      }
      if (!isNaN(firstNum) && isNaN(secondNum)) {
        return -1
      }

      if (firstStr < secondStr) {
        return 1
      }
      if (firstStr > secondStr) {
        return -1
      }
    }
  }
  return 0
}

module.exports = {
  async checkForFirmwareUpdate(motorDriverSerial, firmwareVersion) {
    const queryParams = {
      // Must be bigger or equal to version that started supporting FW update
      app_version: '3.0.0',
      uid: 'NOT_USED_BUT_REQUIRED',
      board_id: `${motorDriverSerial}`,
      fw_version: firmwareVersion,
      n: randomInt(),
    }
    const url = config.boostedBackend.url
    const path = '/api/v1/board/'
    const pathWithQueryParams = addQueryParamsToUrl(path, queryParams)
    const fullUrl = `${url}${pathWithQueryParams}`

    const accessToken = generateHashToken(pathWithQueryParams, config.boostedBackend.secret)

    try {
      const requestData = {
        uri: fullUrl,
        method: 'GET',
        qs: queryParams,
        headers: {
          [config.boostedBackend.authHeader]: accessToken,
        },
        json: true,
      }
      log.info(requestData, 'Querying Boosted backed for firmware update')
      const response = await request(requestData)

      if (response && response.fw_versions_available && Array.isArray(response.fw_versions_available)) {
        if (response.fw_versions_available.length !== 0) {
          const versions = response.fw_versions_available.map(fw => fw.version)
          versions.sort(compareVersion)
          return versions[0]
        }
        return null
      }

      log.error(response, 'Response from the old Boosted backed does not contain expected "fw_versions_available" array')
    } catch (error) {
      log.error(error, `Error retrieving information about available firmware updates for board "${motorDriverSerial}" with current firmware version "${firmwareVersion}"`)
    }

    return null
  },
}
