'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('oidc_clients', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      clientId: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true
      },
      clientSecret: {
        type: Sequelize.STRING(256),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      redirectUris: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      grantTypes: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      scopes: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('oidc_clients', ['clientId'], {
      name: 'oidc_clients_clientId_idx',
      unique: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('oidc_clients');
  }
};

