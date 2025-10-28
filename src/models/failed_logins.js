const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('failed_logins', {
    loginid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userid: {
      type: DataTypes.CHAR(24),
      allowNull: false,
      unique: "failed_logins_userid_key"
    },
    fail_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_failed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'failed_logins',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "failed_logins_pkey",
        unique: true,
        fields: [
          { name: "loginid" },
        ]
      },
      {
        name: "failed_logins_userid_key",
        unique: true,
        fields: [
          { name: "userid" },
        ]
      },
    ]
  });
};
