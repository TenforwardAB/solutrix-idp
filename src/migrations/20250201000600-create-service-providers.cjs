'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('saml_service_providers', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      entityId: {
        type: Sequelize.STRING(512),
        allowNull: false,
        unique: true
      },
      metadataXml: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      acsEndpoints: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      binding: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      attributeMapping: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
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

    await queryInterface.addIndex('saml_service_providers', ['entityId'], {
      name: 'saml_service_providers_entityId_idx',
      unique: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('saml_service_providers');
  }
};

