const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('auth_providers', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    provider_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    auth_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'auth_types',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'auth_providers',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "auth_providers_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
