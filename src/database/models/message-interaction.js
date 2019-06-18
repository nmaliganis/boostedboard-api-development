'use strict'

module.exports = (sequelize, DataTypes) => {
  const MessageInteraction = sequelize.define(
    'messageInteraction',
    {
      messageState: {
        type: DataTypes.ENUM,
        values: ['seen', 'deleted'],
        comment: 'Inbox message can be either later set as seen (opened) or user can delete it to hide it.',
      },
    },
    {
      timestamps: true,
    },
  )

  MessageInteraction.associate = function associate(models) {
    MessageInteraction.belongsTo(models.User)
    MessageInteraction.belongsTo(models.Event)
  }

  return MessageInteraction
}
