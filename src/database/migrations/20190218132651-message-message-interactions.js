'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messageInteractions', {
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      messageState: {
        type: Sequelize.ENUM,
        values: ['seen', 'deleted'],
      },
    })

    await queryInterface.addIndex('messageInteractions', { fields: ['userId'] })
    await queryInterface.addIndex('messageInteractions', { fields: ['eventId'] })
    await queryInterface.addConstraint('messageInteractions', ['userId', 'eventId'], { type: 'unique' })
  },

  down(queryInterface) {
    return queryInterface.dropTable('messageInteractions')
  },
}
