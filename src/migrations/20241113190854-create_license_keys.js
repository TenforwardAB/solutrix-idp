'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('license_keys', {
      licensekeyid: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false,
      },
      licensekey: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      licensemodelid: {
        type: Sequelize.INTEGER,
        references: {
          model: 'license_model',
          key: 'licensemodelid',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      customerid: {
        type: Sequelize.UUID,
        references: {
          model: 'customer',
          key: 'customerid',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('license_keys');
  },
};
