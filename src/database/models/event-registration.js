'use strict'

module.exports = (sequelize, DataTypes) => {
  const EventRegistration = sequelize.define(
    'eventRegistration',
    {
      going: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    },
  )

  EventRegistration.associate = function associate(models) {
    EventRegistration.belongsTo(models.Event)
    EventRegistration.belongsTo(models.User)
  }

  return EventRegistration
}
