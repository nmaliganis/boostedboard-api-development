'use strict'

module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable('mileage', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      boardId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      odometerTotal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      odometerDifference: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      differenceSince: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
  },

  down(queryInterface) {
    return queryInterface.dropTable('mileage')
  },
}
