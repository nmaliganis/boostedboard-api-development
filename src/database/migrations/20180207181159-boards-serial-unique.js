'use strict'

module.exports = {
  async up(queryInterface) {
    // Sequelize can't remove UNIQUE constrain using changeColumn function. Let's hope they won't change naming convention
    // for constrains in future versions :D
    await queryInterface.removeConstraint('boards', 'boards_serial_key')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('boards', 'serial', {
      type: Sequelize.STRING,
      unique: true,
    })
  },
}
