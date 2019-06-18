'use strict'

const config = require('../../config')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cities', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      location: {
        type: Sequelize.GEOGRAPHY,
        allowNull: false,
      },
      radius: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      timeZone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    })

    await queryInterface.addIndex('cities', { fields: ['id'] })
    await queryInterface.addIndex('cities', { fields: ['name'] })

    await queryInterface.bulkInsert('cities', [{
      name: config.app.cities.testCity.name,
      location: config.app.cities.testCity.location,
      radius: config.app.cities.testCity.radius,
      timeZone: config.app.cities.testCity.timeZone,
      imageUrl: config.app.cities.testCity.imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    }])
  },

  down(queryInterface) {
    return queryInterface.dropTable('cities')
  },
}
