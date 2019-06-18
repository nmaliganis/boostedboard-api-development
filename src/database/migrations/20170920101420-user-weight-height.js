'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'weight', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Weight of the user in kilograms',
    })

    await queryInterface.addColumn('users', 'height', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Height of the user in centimeters',
    })

    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.ENUM,
      values: ['male', 'female', 'other'],
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'weight')
    await queryInterface.removeColumn('users', 'height')
    await queryInterface.removeColumn('users', 'gender')
    await queryInterface.sequelize.query('DROP TYPE "enum_users_gender";')
  },
}
