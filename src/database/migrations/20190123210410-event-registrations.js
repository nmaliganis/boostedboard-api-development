'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('eventRegistrations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'events', key: 'id' },
      },
      going: {
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

    await queryInterface.addIndex('eventRegistrations', { fields: ['userId', 'eventId'] })
  },

  down(queryInterface) {
    return queryInterface.dropTable('eventRegistrations')
  },
}
