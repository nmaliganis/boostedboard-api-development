'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM "citySubscriptions" WHERE "deletedAt" IS NOT NULL')
    await queryInterface.removeColumn('citySubscriptions', 'deletedAt')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('citySubscriptions', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    })
  },
}
