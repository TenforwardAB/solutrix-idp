const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('license_keys', {
    licensekeyid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    licensekey: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    licensemodelid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'license_model',
        key: 'licensemodelid'
      }
    },
    customerid: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customer',
        key: 'customerid'
      }
    }
  }, {
    sequelize,
    tableName: 'license_keys',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "license_keys_pkey",
        unique: true,
        fields: [
          { name: "licensekeyid" },
        ]
      },
    ]
  });
};
