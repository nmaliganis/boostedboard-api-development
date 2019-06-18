'use strict'

const config = require('../config/index')

module.exports = {
  request: request => {
    if (!request || typeof request !== 'object') {
      return request
    }

    const serializedRequest = {
      method: request.method,
      url: request.url,
      headers: request.headers,
    }

    if (request.connection) {
      Object.assign(serializedRequest, {
        remoteAddress: request.connection.remoteAddress,
        remotePort: request.connection.remotePort,
      })
    }

    if (config.logging.logRequestBody) {
      serializedRequest.body = processBody(request.body)
    }

    return serializedRequest
  },

  response: response => {
    if (!response || typeof response !== 'object') {
      return response
    }

    const serializedResponse = {
      status: response.status,
      headers: response.headers,
    }

    if (config.logging.logResponseBody) {
      serializedResponse.body = processBody(response.body)
    }

    return serializedResponse
  },

  err: error => {
    if (!error || typeof error !== 'object') {
      return error
    }

    return {
      name: error.name,
      type: error.type,
      status: error.status,
      message: error.message,
      correlationId: error.correlationId,
      stack: getFullErrorStack(error),
    }
  },
}

function processBody(body) {
  const sizeLimit = config.logging.maximumBodySize
  const stringifiedBody = JSON.stringify(body)
  if (typeof stringifiedBody === 'string' && JSON.stringify(body).length > sizeLimit) {
    return { message: `Body is excluded due to being larger than ${sizeLimit} bytes.` }
  }

  return body
}

/**
 * Copied from bunyan stdSerializer
 * @param {Error} ex Error object
 * @return {string}
 */
function getFullErrorStack(ex) {
  let ret = ex.stack || ex.toString()
  if (ex.cause && typeof ex.cause === 'function') {
    const cex = ex.cause()
    if (cex) {
      ret += `\nCaused by: ${getFullErrorStack(cex)}`
    }
  }
  return ret
}
