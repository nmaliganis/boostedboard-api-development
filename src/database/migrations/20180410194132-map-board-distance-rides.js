'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('rides', 'distance', 'mapDistance')
    await queryInterface.renameColumn('rides', 'averageSpeed', 'mapAverageSpeed')
    await queryInterface.addColumn('rides', 'boardDistance', { type: Sequelize.FLOAT, allowNull: false })
    await queryInterface.addColumn('rides', 'boardAverageSpeed', { type: Sequelize.FLOAT, allowNull: false })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('rides', 'boardAverageSpeed')
    await queryInterface.removeColumn('rides', 'boardDistance')
    await queryInterface.renameColumn('rides', 'mapAverageSpeed', 'averageSpeed')
    await queryInterface.renameColumn('rides', 'mapDistance', 'distance')
  },
}
