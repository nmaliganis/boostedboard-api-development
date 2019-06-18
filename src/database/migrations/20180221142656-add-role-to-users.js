'use strict'

module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM,
      values: ['user', 'admin'],
      defaultValues: 'user',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'role')
    await queryInterface.sequelize.query('DROP TYPE "enum_users_role";')
  },
}
