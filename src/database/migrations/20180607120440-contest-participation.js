'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contestParticipations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      contestId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.GEOGRAPHY,
        allowNull: true,
      },
      accepted: {
        type: Sequelize.BOOLEAN,
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

    await queryInterface.addIndex('contestParticipations', { fields: ['location'] })
    await queryInterface.addIndex('contestParticipations', ['userId', 'contestId'], {
      indicesType: 'UNIQUE',
    })
  },

  down(queryInterface) {
    return queryInterface.dropTable('contestParticipations')
  },
}
