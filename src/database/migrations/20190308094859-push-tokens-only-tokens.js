'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pushTokens', 'subscriptionArn')
    await queryInterface.addColumn('pushTokens', 'enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('pushTokens', 'subscriptionArn', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.removeColumn('pushTokens', 'enabled')
  },
}
