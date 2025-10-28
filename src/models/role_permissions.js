const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('role_permissions', {
    rolepermissionid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    rolename: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'role',
        key: 'rolename'
      }
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'role_permissions',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "role_permissions_pkey",
        unique: true,
        fields: [
          { name: "rolepermissionid" },
        ]
      },
    ]
  });
};
