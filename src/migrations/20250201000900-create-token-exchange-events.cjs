'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('token_exchange_events', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      clientId: {
        allowNull: false,
        type: Sequelize.STRING(128)
      },
      policyId: {
        allowNull: true,
        type: Sequelize.UUID
      },
      subject: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      subjectTokenType: {
        allowNull: false,
        type: Sequelize.STRING(255)
      },
      subjectTokenId: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      requestedAudience: {
        allowNull: true,
        type: Sequelize.STRING(512)
      },
      grantedAudience: {
        allowNull: true,
        type: Sequelize.STRING(512)
      },
      requestedScopes: {
        allowNull: true,
        type: Sequelize.JSONB
      },
      grantedScopes: {
        allowNull: true,
        type: Sequelize.JSONB
      },
      actorSubject: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      success: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      error: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      issuedTokenId: {
        allowNull: true,
        type: Sequelize.STRING(255)
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

    await queryInterface.addIndex('token_exchange_events', ['clientId', 'createdAt'], {
      name: 'token_exchange_events_client_created_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('token_exchange_events');
  }
};
