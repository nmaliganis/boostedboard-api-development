'use strict'

module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define(
    'board',
    {
      serial: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique serial number of the board',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Name user associated with the board',
      },
      motorDriverSerial: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Unique serial number of the motor driver',
      },
      batterySerial: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Unique serial number of the battery',
      },
      purchaseLocation: {
        type: DataTypes.ENUM,
        values: ['Boostedboards.com', 'Amazon', 'Best Buy', 'Retail Store', 'Used board', 'Other'],
        allowNull: true,
        comment: 'A place where the user has bought the board',
      },
      firmwareVersion: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Current version of a firmware the board has',
      },
      type: {
        type: DataTypes.ENUM,
        values: ['unknown', 'single', 'dual', 'dual+', 'plus', 'stealth', 'mini s', 'mini x', 'rev'],
        allowNull: true,
        comment: 'Type of the board',
      },
    },
    {
      timestamps: true,
      paranoid: true,
      scopes: {
        admin: {
          attributes: [
            'id',
            'serial',
            'name',
            'batterySerial',
            'motorDriverSerial',
            'purchaseLocation',
            'firmwareVersion',
            'type',
            'createdAt',
            'updatedAt',
          ],
        },
      },
    },
  )

  Board.associate = function associate(models) {
    Board.belongsTo(models.User)
    Board.hasMany(models.Ride)
  }

  return Board
}
