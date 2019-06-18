'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;')

    await queryInterface.createTable('breadcrumbs', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      rideId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'rides', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      location: {
        type: Sequelize.GEOGRAPHY,
        allowNull: false,
      },
    })
    await queryInterface.addIndex('breadcrumbs', { fields: ['rideId'] })
    await queryInterface.addIndex('breadcrumbs', { fields: ['timestamp'] })
  },

  down(queryInterface) {
    return queryInterface.dropTable('breadcrumbs')
  },
}
