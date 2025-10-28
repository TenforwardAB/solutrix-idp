'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_auth_config', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customer',
          key: 'customerid'
        },
        onDelete: 'CASCADE'
      },
      auth_provider_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_providers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      client_id: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      client_secret: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      callback_url: {
        type: Sequelize.STRING(255)
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customer_auth_config');
  }
};
