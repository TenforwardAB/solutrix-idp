const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('license_model', {
    licensemodelid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    modelname: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerid: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customer',
        key: 'customerid'
      },
      unique: "unique_active_license_per_customer"
    },
    valid_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    max_reviews: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    license_limit_type: {
      type: DataTypes.STRING(4),
      allowNull: false,
      defaultValue: "soft"
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      unique: "unique_active_license_per_customer"
    },
    max_edgerunners: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'license_model',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "license_model_pkey",
        unique: true,
        fields: [
          { name: "licensemodelid" },
        ]
      },
      {
        name: "unique_active_license_per_customer",
        unique: true,
        fields: [
          { name: "customerid" },
          { name: "active" },
        ]
      },
    ]
  });
};
