'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('oidc_adapter_store', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(128)
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(64)
      },
      payload: {
        allowNull: false,
        type: Sequelize.JSONB
      },
      grantId: {
        allowNull: true,
        type: Sequelize.STRING(128)
      },
      userCode: {
        allowNull: true,
        type: Sequelize.STRING(128),
        unique: true
      },
      uid: {
        allowNull: true,
        type: Sequelize.STRING(128),
        unique: true
      },
      expiresAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
      consumedAt: {
        allowNull: true,
        type: Sequelize.DATE
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

    await queryInterface.addIndex('oidc_adapter_store', ['name'], {
      name: 'oidc_adapter_store_name_idx'
    });

    await queryInterface.addIndex('oidc_adapter_store', ['grantId'], {
      name: 'oidc_adapter_store_grantId_idx'
    });

    await queryInterface.addIndex('oidc_adapter_store', ['expiresAt'], {
      name: 'oidc_adapter_store_expiresAt_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('oidc_adapter_store');
  }
};
