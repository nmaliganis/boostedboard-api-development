'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rides', {
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
      boardId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      averageSpeed: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      topSpeed: {
        type: Sequelize.FLOAT,
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

    await queryInterface.addIndex('rides', { fields: ['userId'] })
    await queryInterface.sequelize.query('ALTER TABLE rides ADD CONSTRAINT "startBeforeEnd" CHECK ("startTime" <= "endTime");')
  },

  down(queryInterface) {
    return queryInterface.dropTable('rides')
  },
}
