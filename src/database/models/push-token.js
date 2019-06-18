'use strict'

module.exports = (sequelize, DataTypes) => {
  const PushToken = sequelize.define('pushToken', {
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    endpointArn: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    timestamps: true,
  })

  PushToken.associate = function associate(models) {
    PushToken.belongsTo(models.User)
    PushToken.hasMany(models.SubscriptionArn)
  }

  return PushToken
}
