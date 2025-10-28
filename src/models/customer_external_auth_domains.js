const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('customer_external_auth_domains', {
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
      },
      unique: "unique_customer_email_domain"
    },
    email_domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "unique_customer_email_domain"
    }
  }, {
    sequelize,
    tableName: 'customer_external_auth_domains',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "customer_external_auth_domains_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "unique_customer_email_domain",
        unique: true,
        fields: [
          { name: "customer_id" },
          { name: "email_domain" },
        ]
      },
    ]
  });
};
