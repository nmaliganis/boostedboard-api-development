'use strict'

module.exports = sequelize => {
  const CitySubscription = sequelize.define(
    'citySubscription',
    {
    },
    {
      timestamps: true,
    },
  )

  CitySubscription.associate = function associate(models) {
    CitySubscription.belongsTo(models.User)
    CitySubscription.belongsTo(models.City)
  }

  return CitySubscription
}
