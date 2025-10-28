const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('resource_types', {
    resourceid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "resource_types_name_key"
    }
  }, {
    sequelize,
    tableName: 'resource_types',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "resource_types_name_key",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
      {
        name: "resource_types_pkey",
        unique: true,
        fields: [
          { name: "resourceid" },
        ]
      },
    ]
  });
};
