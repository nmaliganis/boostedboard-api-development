'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('rides', 'topSpeed', 'mapTopSpeed')
    await queryInterface.addColumn('rides', 'boardTopSpeed', { type: Sequelize.FLOAT, allowNull: true })
    await queryInterface.addColumn('rides', 'odometerStart', { type: Sequelize.FLOAT, allowNull: true })
    await queryInterface.addColumn('rides', 'odometerFinish', { type: Sequelize.FLOAT, allowNull: true })

    await queryInterface.addColumn('breadcrumbs', 'altitude', { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 })
    await queryInterface.changeColumn('breadcrumbs', 'altitude', { type: Sequelize.FLOAT, allowNull: false })
    await queryInterface.addColumn('breadcrumbs', 'boardSpeed', { type: Sequelize.FLOAT, allowNull: true })
    await queryInterface.addColumn('breadcrumbs', 'boardBatteryRemaining', { type: Sequelize.INTEGER, allowNull: true })
    await queryInterface.addColumn('breadcrumbs', 'boardPowerOutput', { type: Sequelize.FLOAT, allowNull: true })
    await queryInterface.addColumn('breadcrumbs', 'boardMode', {
      type: Sequelize.ENUM,
      values: ['beginner', 'eco', 'expert', 'pro', 'hyper'],
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.renameColumn('rides', 'mapTopSpeed', 'topSpeed')
    await queryInterface.removeColumn('rides', 'boardTopSpeed')
    await queryInterface.removeColumn('rides', 'odometerStart')
    await queryInterface.removeColumn('rides', 'odometerFinish')

    await queryInterface.removeColumn('breadcrumbs', 'altitude')
    await queryInterface.removeColumn('breadcrumbs', 'boardSpeed')
    await queryInterface.removeColumn('breadcrumbs', 'boardBatteryRemaining')
    await queryInterface.removeColumn('breadcrumbs', 'boardPowerOutput')
    await queryInterface.removeColumn('breadcrumbs', 'boardMode')

    await queryInterface.sequelize.query('DROP TYPE "enum_breadcrumbs_boardMode";')
  },
}
