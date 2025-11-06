'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('identity_policies', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      targetType: {
        type: Sequelize.STRING(32),
        allowNull: false
      },
      targetId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      policy: {
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

    await queryInterface.addIndex('identity_policies', ['targetType', 'targetId'], {
      name: 'identity_policies_target_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('identity_policies');
  }
};

