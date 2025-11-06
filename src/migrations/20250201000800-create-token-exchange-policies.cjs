'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('token_exchange_policies', {
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
      priority: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      subject: {
        allowNull: true,
        type: Sequelize.STRING(255)
      },
      subjectTokenTypes: {
        allowNull: false,
        type: Sequelize.JSONB,
        defaultValue: []
      },
      audiences: {
        allowNull: false,
        type: Sequelize.JSONB,
        defaultValue: []
      },
      scopes: {
        allowNull: true,
        type: Sequelize.JSONB
      },
      actorTokenRequired: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      enabled: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      description: {
        allowNull: true,
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('token_exchange_policies', ['clientId', 'priority'], {
      name: 'token_exchange_policies_client_priority_idx'
    });
    await queryInterface.addIndex('token_exchange_policies', ['clientId', 'subject'], {
      name: 'token_exchange_policies_client_subject_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('token_exchange_policies');
  }
};
