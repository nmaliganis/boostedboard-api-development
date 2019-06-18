'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('users', 'username')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },
}
