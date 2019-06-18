'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pushTokens', 'endpointArn', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('pushTokens', 'subscriptionArn', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pushTokens', 'endpointArn')
    await queryInterface.removeColumn('pushTokens', 'subscriptionArn')
  },
}
