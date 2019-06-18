'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rides', 'shared', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('rides', 'shared')
  },
}
