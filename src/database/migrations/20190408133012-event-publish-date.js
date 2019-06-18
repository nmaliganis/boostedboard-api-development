'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('events', 'publishedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('events', 'publishedAt')
  },
}
