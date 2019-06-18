'use strict'

/* eslint-disable max-len */

const bluebird = require('bluebird')
const SqlString = require('sequelize/lib/sql-string')
const notificationService = require('../services/notification')
const { sequelize } = require('../database')
const log = require('../common/logger')

async function addEndpointArnsToTokensInDB() {
  // Step 1 - Get tokens from the DB that have no endpointArn assigned
  const tokensWithoutEndpointQuery = `
  SELECT id, token, "deviceId"
  FROM "pushTokens"
  WHERE "endpointArn" IS NULL
  `
  log.info('Executing an SQL query to get all tokens without a platform endpoint assigned')
  const relevantTokens = (await sequelize.query(tokensWithoutEndpointQuery))[0]
  log.info(`In total ${relevantTokens.length} such tokens retrieved`)

  // Step 2 - Generate endpointArn for each token (by calling SNS)
  log.info('Querying SNS to obtain the endpointArn using the generatePlatformEndpointArn(token) function. Making a single call for each token, using { concurrency: 10 } this might take up to few minutes')
  const endpointsToAssign = await bluebird.map(relevantTokens, async token => ({
    id: token.id,
    endpointArn: await notificationService.generatePlatformEndpointArn(token),
  }), { concurrency: 10 })
  log.info('All endpointArns obtained')

  // Step 3 - Update those token records in the DB - assign them a new endpointArn
  const endpointsToAssignString = endpointsToAssign.map(endpoint => `(${endpoint.id}, ${SqlString.escape(endpoint.endpointArn)})`).join(',')
  const updateEndpointsForTokensQuery = `
  UPDATE "pushTokens" as pt
  SET
    "endpointArn" = val."endpointArn"
  FROM (values
    ${endpointsToAssignString}
  ) AS val(id, "endpointArn")
  WHERE val.id = pt.id
  `
  log.info('Beginning (first 5000 characters) of the update query', updateEndpointsForTokensQuery.substring(0, 5000))
  await sequelize.query(updateEndpointsForTokensQuery)
  log.info('Query finished - push tokens updated')
}

module.exports = addEndpointArnsToTokensInDB

// Run the script if this file specifically is run with node as an entry point
if (require.main === module) {
  addEndpointArnsToTokensInDB()
    .then(() => {
      log.info('Script finished')
    })
    .finally(() => {
      sequelize.close()
    })
}
