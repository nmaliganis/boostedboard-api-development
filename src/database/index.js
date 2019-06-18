'use strict'

const pg = require('pg')
const { Sequelize, Op } = require('sequelize')
const _ = require('lodash')
const config = require('../config/index')
const models = require('./models')

// This makes sequelize to return integers as numbers, not as a string
pg.defaults.parseInt8 = true
const sequelize = new Sequelize(config.database.connectionString, config.database.options)

// Import all models
const db = {}
Object.entries(models).forEach(([modelName, modelDef]) => {
  const model = sequelize.import(modelName, modelDef)
  db[_.upperFirst(model.name)] = model
})

// Load relations between models
Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize
db.Op = Op

module.exports = db
