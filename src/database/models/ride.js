'use strict'

module.exports = (sequelize, DataTypes) => {
  const Ride = sequelize.define(
    'ride',
    {
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      mapDistance: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      mapAverageSpeed: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      boardDistance: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      boardAverageSpeed: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      mapTopSpeed: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      boardTopSpeed: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      odometerStart: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      odometerFinish: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      shared: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      indexes: [{ fields: ['userId'] }],
    },
  )

  Ride.associate = function associate(models) {
    Ride.belongsTo(models.User)
    Ride.hasMany(models.Breadcrumb)
  }

  return Ride
}
