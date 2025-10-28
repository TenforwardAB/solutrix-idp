const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('domains', {
    domainid: {
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
    domain_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "domains_domain_name_key"
    },
    registrar: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    attributes: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'domains',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "domains_domain_name_key",
        unique: true,
        fields: [
          { name: "domain_name" },
        ]
      },
      {
        name: "domains_pkey",
        unique: true,
        fields: [
          { name: "domainid" },
        ]
      },
    ]
  });
};
