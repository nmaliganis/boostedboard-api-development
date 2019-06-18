'use strict'

const _ = require('lodash')

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('refreshToken', {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User agent which created the refresh token.',
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP from which the refresh token was created.',
    },
  }, {
    timestamps: true,
  })

  RefreshToken.prototype.toJSON = function toJSON() {
    return _.omit(this.get(), ['token'])
  }

  RefreshToken.associate = function associate(models) {
    RefreshToken.belongsTo(models.User)
  }

  return RefreshToken
}
