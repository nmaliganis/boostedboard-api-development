'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('boards', 'type')
    await queryInterface.addColumn('boards', 'type', {
      type: Sequelize.ENUM,
      values: ['unknown', 'single', 'dual', 'dual+', 'plus', 'stealth', 'mini s', 'mini x', 'rev'],
      allowNull: true,
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('boards', 'type')
    await queryInterface.sequelize.query('DROP TYPE "enum_boards_type";')
    await queryInterface.addColumn('boards', 'type', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },
}
