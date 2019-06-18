'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.changeColumn('mileage', 'odometerTotal', {
        type: Sequelize.FLOAT,
        allowNull: false,
      }),
      queryInterface.changeColumn('mileage', 'odometerDifference', {
        type: Sequelize.FLOAT,
        allowNull: false,
      }),
    ])

    return queryInterface.addIndex('mileage', ['boardId', 'differenceSince'], {
      indicesType: 'UNIQUE',
    })
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.changeColumn('mileage', 'odometerTotal', {
        type: Sequelize.INTEGER,
        allowNull: false,
      }),
      queryInterface.changeColumn('mileage', 'odometerDifference', {
        type: Sequelize.INTEGER,
        allowNull: false,
      }),
    ])

    return queryInterface.removeIndex('mileage', ['boardId', 'differenceSince'])
  },
}
