'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('events', 'notification', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('events', 'topic', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('events', 'notification')
    await queryInterface.removeColumn('events', 'topic')
  },
}
