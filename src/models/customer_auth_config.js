const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('customer_auth_config', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customer',
        key: 'customerid'
      }
    },
    auth_provider_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'auth_providers',
        key: 'id'
      }
    },
    client_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    client_secret: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    callback_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'customer_auth_config',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    indexes: [
      {
        name: "customer_auth_config_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
