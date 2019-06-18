'use strict'

module.exports = (sequelize, DataTypes) => {
  const Mileage = sequelize.define(
    'mileage',
    {
      boardId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Unique identifier of a board',
      },
      odometerTotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Total distance traveled by a board in meters',
      },
      odometerDifference: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Total distance traveled by a board since previous record in meters',
      },
      differenceSince: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Timestamp of previous record',
      },
    },
    {
      timestamps: true,
      tableName: 'mileage',
    },
  )

  Mileage.associate = function associate(models) {
    Mileage.belongsTo(models.User)
  }

  return Mileage
}
