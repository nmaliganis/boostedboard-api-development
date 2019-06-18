'use strict'

/* eslint-disable no-sync, global-require */
const path = require('path')
const fs = require('fs')
const Bluebird = require('bluebird')
const db = require('../../src/database')

let migrations = []
let seeders = []

let dbPrepared = false

loadDatabaseFiles()

function loadDatabaseFiles() {
  const migrationsList = fs.readdirSync(path.resolve(__dirname, '../../src/database/migrations'))
  migrations = migrationsList.map(mig => require(`../../src/database/migrations/${mig}`))

  const seedersList = fs.readdirSync(path.resolve(__dirname, '../../src/database/seeders'))
    .filter(file => file.match(/.*\.js$/u))
  seeders = seedersList.map(seeder => require(`../../src/database/seeders/${seeder}`))
}

function migrateDb() {
  return Bluebird.mapSeries(migrations, mig => mig.up(db.sequelize.queryInterface, db.Sequelize))
}

function truncateDb() {
  return Bluebird.mapSeries(Object.values(db.sequelize.models), model =>
    model.truncate({ cascade: true, force: true, restartIdentity: true }))
}

function seedDb() {
  return Bluebird.mapSeries(seeders, seeder => seeder.up(db.sequelize.queryInterface))
}

async function prepareDb() {
  await db.sequelize.queryInterface.dropAllTables()
  await migrateDb()

  return true
}

async function resetDb() {
  if (!dbPrepared) {
    await prepareDb()
    dbPrepared = true
  }
  await truncateDb()
  await seedDb()

  return true
}

module.exports = {
  prepareDb,
  resetDb,
}
