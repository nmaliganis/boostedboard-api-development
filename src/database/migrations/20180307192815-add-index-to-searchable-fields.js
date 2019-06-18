'use strict'

module.exports = {
  up(queryInterface) {
    return Promise.all([
      queryInterface.addIndex('users', ['name']),
      queryInterface.addIndex('users', ['createdAt']),
      queryInterface.addIndex('boards', ['serial']),
    ])
  },

  down(queryInterface) {
    return Promise.all([
      queryInterface.removeIndex('users', ['name']),
      queryInterface.removeIndex('users', ['createdAt']),
      queryInterface.removeIndex('boards', ['serial']),
    ])
  },
}
