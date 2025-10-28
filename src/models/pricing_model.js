const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('pricing_model', {
    pricingmodelid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    modelname: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cost: {
      type: DataTypes.DECIMAL,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'pricing_model',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "pricing_model_pkey",
        unique: true,
        fields: [
          { name: "pricingmodelid" },
        ]
      },
    ]
  });
};
