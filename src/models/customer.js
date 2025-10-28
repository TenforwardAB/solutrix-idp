const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('customer', {
    customerid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customername: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phonenumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    pricingmodelid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'pricing_model',
        key: 'pricingmodelid'
      }
    },
    allow_superadmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    external_auth: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'customer',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "customer_pkey",
        unique: true,
        fields: [
          { name: "customerid" },
        ]
      },
    ]
  });
};
