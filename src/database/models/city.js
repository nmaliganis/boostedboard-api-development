'use strict'

module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define(
    'city',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Name of the city',
      },
      location: {
        type: DataTypes.GEOGRAPHY,
        allowNull: false,
        get() {
          return this.getDataValue('location') && this.getDataValue('location').coordinates
        },
        set(coordinates) {
          this.setDataValue('location', { type: 'Point', coordinates })
        },
        comment: 'Center of the city',
      },
      radius: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      timeZone: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of the timezone of the city using the TZ database names',
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Image URL to show in mobile app as a fallback if an event has no picture',
      },
    },
    {
      timestamps: true,
      tableName: 'cities',
    },
  )

  City.associate = function associate(models) {
    City.belongsToMany(models.User, {
      through: models.CitySubscription,
      foreignKey: 'cityId',
    })
    City.hasMany(models.Event)
  }

  return City
}
