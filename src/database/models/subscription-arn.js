'use strict'

module.exports = (sequelize, DataTypes) => {
  const SubscriptionArn = sequelize.define(
    'subscriptionArn',
    {
      arn: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      indexes: [{ fields: ['userId'] }, { fields: ['cityId, userId'] }],
    },
  )

  SubscriptionArn.associate = function associate(models) {
    SubscriptionArn.belongsTo(models.User)
    SubscriptionArn.belongsTo(models.PushToken)
  }

  return SubscriptionArn
}
