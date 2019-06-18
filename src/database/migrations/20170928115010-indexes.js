'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('users', ['email'])
    await queryInterface.addIndex('users', ['username'])
    await queryInterface.addIndex('users', ['facebookId'])
    await queryInterface.addIndex('users', ['googleId'])
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', ['email'])
    await queryInterface.removeIndex('users', ['username'])
    await queryInterface.removeIndex('users', ['facebookId'])
    await queryInterface.removeIndex('users', ['googleId'])
  },
}
