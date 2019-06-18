'use strict'

module.exports = (sequelize, DataTypes) => {
  const DailyAverage = sequelize.define('dailyAverage', {
    mileageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Unique identifier of a record from Mileages table',
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date for which is the average value calculated',
    },
    average: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Date for which is the average value calculated',
    },
  }, {
    timestamps: true,
  })

  DailyAverage.associate = function associate(models) {
    DailyAverage.belongsTo(models.Mileage)
  }

  return DailyAverage
}
