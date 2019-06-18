'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('spots', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM,
        values: ['charging', 'hazard'],
        allowNull: false,
      },
      location: {
        type: Sequelize.GEOGRAPHY,
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
    await queryInterface.addIndex('spots', { fields: ['type'] })
    await queryInterface.addIndex('spots', { fields: ['location'], method: 'GIST' })
  },

  down(queryInterface) {
    return queryInterface.dropTable('spots')
  },
}
