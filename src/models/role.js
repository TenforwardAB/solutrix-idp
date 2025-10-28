const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('role', {
    roleid: {
      type: DataTypes.CHAR(4),
      allowNull: false,
      primaryKey: true
    },
    rolename: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "role_rolename_key"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'role',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "role_pkey",
        unique: true,
        fields: [
          { name: "roleid" },
        ]
      },
      {
        name: "role_rolename_key",
        unique: true,
        fields: [
          { name: "rolename" },
        ]
      },
    ]
  });
};
