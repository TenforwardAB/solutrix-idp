const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('issues', {
    issueid: {
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
    issue: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'issues',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "issues_pkey",
        unique: true,
        fields: [
          { name: "issueid" },
        ]
      },
    ]
  });
};
