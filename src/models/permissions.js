const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('permissions', {
    permissionid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "permissions_name_key"
    }
  }, {
    sequelize,
    tableName: 'permissions',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "permissions_name_key",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
      {
        name: "permissions_pkey",
        unique: true,
        fields: [
          { name: "permissionid" },
        ]
      },
    ]
  });
};
