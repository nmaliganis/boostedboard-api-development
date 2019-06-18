'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('boards', 'purchaseLocation', {
      type: Sequelize.ENUM,
      values: ['Boostedboards.com', 'Amazon', 'Best Buy', 'Retail Store', 'Used board', 'Other'],
      allowNull: true,
    })

  },

  async down(queryInterface) {
    await queryInterface.removeColumn('boards', 'purchaseLocation')
    await queryInterface.sequelize.query('DROP TYPE "enum_boards_purchaseLocation";')
  },
}
