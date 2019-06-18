'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('boards', 'motorDriverSerial', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('boards', 'batterySerial', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('boards', 'motorDriverSerial')
    await queryInterface.removeColumn('boards', 'batterySerial')
  },
}
