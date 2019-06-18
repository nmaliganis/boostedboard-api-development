'use strict'

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    'event',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of the event',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Full text/description of the event',
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Description of where exactly is the event taking place',
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Image URL to show in mobile app as a fallback if an event has no picture',
      },
      linkText: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'If an event has a additional link to click, this text will be shown',
      },
      linkUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'The actual URL to which the link point to',
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.fn('NOW'),
      },
    },
    {
      timestamps: true,
    },
  )

  Event.associate = function associate(models) {
    Event.belongsTo(models.City)
    Event.hasMany(models.EventRegistration)
    Event.belongsToMany(models.User, {
      through: models.MessageInteraction,
      foreignKey: 'eventId',
    })
  }

  return Event
}
