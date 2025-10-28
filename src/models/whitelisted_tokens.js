const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('whitelisted_tokens', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    token_type: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'whitelisted_tokens',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    indexes: [
      {
        name: "whitelisted_tokens_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "whitelisted_tokens_token_hash_idx",
        fields: [
          { name: "token" },
        ]
      },
    ]
  });
};
