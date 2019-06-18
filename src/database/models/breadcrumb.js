'use strict'

module.exports = (sequelize, DataTypes) => {
  const Breadcrumb = sequelize.define(
    'breadcrumb',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      location: {
        type: DataTypes.GEOGRAPHY,
        allowNull: false,
        get() {
          return this.getDataValue('location').coordinates
        },
        set(coordinates) {
          this.setDataValue('location', { type: 'Point', coordinates })
        },
      },
      altitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Current altitude in meters',
      },
      boardSpeed: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Current speed from Board in meters per second',
      },
      boardBatteryRemaining: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Current board battery remaining in % (set only when changed)',
      },
      boardPowerOutput: {
        type: DataTypes.FLOAT,
        allowNull: true,
        // eslint-disable-next-line no-warning-comments
        // TODO: add unit
        comment: 'Current board power output in (TODO)',
      },
      boardMode: {
        type: DataTypes.ENUM,
        values: ['beginner', 'eco', 'expert', 'pro', 'hyper'],
        allowNull: true,
        comment: 'Current board performance mode (set only when changed)',
      },
      alternativeMove: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Specifies if the user is currently using alternative move (true) or is riding board (false)',
      },
    },
    {
      timestamps: false,
      indexes: [{ fields: ['rideId'] }, { fields: ['timestamp'] }],
    },
  )

  Breadcrumb.associate = function associate(models) {
    Breadcrumb.belongsTo(models.Ride)
  }

  return Breadcrumb
}
