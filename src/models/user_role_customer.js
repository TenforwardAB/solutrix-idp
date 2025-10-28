const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_role_customer', {
    userrolecustomerid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userid: {
      type: DataTypes.CHAR(24),
      allowNull: false,
      unique: "user_role_customer_userid_key"
    },
    roleid: {
      type: DataTypes.CHAR(4),
      allowNull: true,
      references: {
        model: 'role',
        key: 'roleid'
      },
      unique: "unique_user_role_customer"
    },
    customerid: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customer',
        key: 'customerid'
      },
      unique: "unique_user_role_customer"
    },
    assigneddate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'user_role_customer',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "unique_user_role_customer",
        unique: true,
        fields: [
          { name: "userid" },
          { name: "roleid" },
          { name: "customerid" },
        ]
      },
      {
        name: "user_role_customer_pkey",
        unique: true,
        fields: [
          { name: "userrolecustomerid" },
        ]
      },
      {
        name: "user_role_customer_userid_key",
        unique: true,
        fields: [
          { name: "userid" },
        ]
      },
    ]
  });
};
