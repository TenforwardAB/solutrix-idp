const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('jwt_rsa256_keys', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    privateKey: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customer',
        key: 'customerid'
      }
    },
    keyId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: "jwt_rsa256_keys_keyId_key"
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isInvalid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'jwt_rsa256_keys',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    indexes: [
      {
        name: "jwt_rsa256_keys_keyId_key",
        unique: true,
        fields: [
          { name: "keyId" },
        ]
      },
      {
        name: "jwt_rsa256_keys_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
