'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('events')
    await queryInterface.dropTable('contestParticipations')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.GEOGRAPHY,
        allowNull: true,
      },
      published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.DATE,
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
      notification: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      topic: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    })

    await queryInterface.addIndex('events', { fields: ['startTime'] })
    await queryInterface.addIndex('events', { fields: ['endTime'] })

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
}
