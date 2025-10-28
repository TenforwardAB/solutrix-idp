const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('rescue_email_mappings', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    rescue_mail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "rescue_email_mappings_rescue_mail_key"
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "rescue_email_mappings_email_key"
    }
  }, {
    sequelize,
    tableName: 'rescue_email_mappings',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "rescue_email_mappings_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "rescue_email_mappings_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "rescue_email_mappings_rescue_mail_key",
        unique: true,
        fields: [
          { name: "rescue_mail" },
        ]
      },
    ]
  });
};
