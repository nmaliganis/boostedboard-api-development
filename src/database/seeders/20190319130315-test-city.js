'use strict'

const config = require('../../config')

module.exports = {
  async up(queryInterface) {
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

  async down(queryInterface) {
    await queryInterface.bulkDelete('cities', null, {})
  },
}
