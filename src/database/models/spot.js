'use strict'

module.exports = (sequelize, DataTypes) => {
  const Spot = sequelize.define(
    'spot',
    {
      type: {
        type: DataTypes.ENUM,
        values: ['charging', 'hazard'],
        allowNull: false,
      },
      location: {
        type: DataTypes.GEOGRAPHY,
        allowNull: false,
        get() {
          return this.getDataValue('location').coordinates
        },
        set(coordinates) {
          this.setDataValue('location', { type: 'Point', coordinates })
        },
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ['type'] },
        { fields: ['location'], method: 'GIST' },
      ],
    },
  )

  Spot.associate = function associate(models) {
    Spot.belongsTo(models.User)
  }

  return Spot
}
