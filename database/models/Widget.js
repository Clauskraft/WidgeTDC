const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Widget = sequelize.define('Widget', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    version: {
git commit -m "feat: Implement foundation systems with database layer - DatabaseMaster Block 4 (50pts)"
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'widgets',
    timestamps: true
  });

  return Widget;
};
