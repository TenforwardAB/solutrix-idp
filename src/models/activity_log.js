const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('activity_log', {
    activityid: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    userid: {
      type: DataTypes.CHAR(24),
      allowNull: false
    },
    useremail: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    customerid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customer',
        key: 'customerid'
      }
    },
    activity_info: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'activity_log',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "activity_log_pkey",
        unique: true,
        fields: [
          { name: "activityid" },
        ]
      },
      {
        name: "idx_activity_log_userid_status_createdat",
        fields: [
          { name: "userid" },
          { name: "createdAt", order: "DESC" },
        ]
      },
    ]
  });
};
