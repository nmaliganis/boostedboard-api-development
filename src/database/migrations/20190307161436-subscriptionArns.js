'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptionArns', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      pushTokenId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pushTokens', key: 'id' },
      },
      arn: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    })

    await queryInterface.addIndex('subscriptionArns', { fields: ['userId'] })
    await queryInterface.addConstraint('subscriptionArns', ['userId', 'pushTokenId'], { type: 'unique' })
  },

  down(queryInterface) {
    return queryInterface.dropTable('subscriptionArns')
  },
}
