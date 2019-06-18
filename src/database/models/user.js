'use strict'

const _ = require('lodash')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'user',
    {
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      facebookId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      weight: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Weight of the user in kilograms',
      },
      height: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Height of the user in centimeters',
      },
      gender: {
        type: DataTypes.ENUM,
        values: ['male', 'female', 'other'],
        allowNull: true,
      },
      pictureUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM,
        values: ['user', 'admin'],
        defaultValue: 'user',
      },
    },
    {
      timestamps: true,
      paranoid: true,
      indexes: [{ fields: ['email'] }, { fields: ['facebookId'] }, { fields: ['googleId'] }],
      scopes: {
        admin: {
          attributes: ['id', 'email', 'gender', 'name', 'height', 'weight', 'pictureUrl', 'role', 'createdAt', 'updatedAt'],
        },
      },
    },
  )

  User.prototype.toJSON = function toJSON() {
    const profile = this.get()
    profile.contests = profile.contestParticipations
    return _.omit(this.get(), ['password', 'contestParticipations'])
  }

  User.prototype.isAdmin = function isAdmin() {
    return this.get().role === 'admin'
  }

  User.associate = function associate(models) {
    User.hasMany(models.RefreshToken)
    User.hasMany(models.PushToken)
    User.hasMany(models.Board)
    User.hasMany(models.Mileage)
    User.hasMany(models.Ride)
    User.belongsToMany(models.City, {
      through: models.CitySubscription,
      as: 'subscribedCities',
      foreignKey: 'userId',
    })
    User.belongsToMany(models.Event, {
      through: models.MessageInteraction,
      as: 'seenEvents',
      foreignKey: 'userId',
    })
    User.hasMany(models.EventRegistration)
    User.hasMany(models.SubscriptionArn)
  }

  return User
}
