'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dailyAverages', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      mileageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'mileage',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      day: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      average: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    return queryInterface.addIndex('dailyAverages', ['day'])
  },

  down(queryInterface) {
    return queryInterface.dropTable('dailyAverages')
  },
}
