const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('edgerunner', {
    edgerunnerid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customerid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customer',
        key: 'customerid'
      }
    },
    licensekeyid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'license_keys',
        key: 'licensekeyid'
      }
    },
    hwkey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "edgerunner_hwkey_key"
    }
  }, {
    sequelize,
    tableName: 'edgerunner',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "edgerunner_hwkey_key",
        unique: true,
        fields: [
          { name: "hwkey" },
        ]
      },
      {
        name: "edgerunner_pkey",
        unique: true,
        fields: [
          { name: "edgerunnerid" },
        ]
      },
    ]
  });
};
