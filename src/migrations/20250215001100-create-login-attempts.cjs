'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('login_attempts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      attemptKey: {
        allowNull: false,
        type: Sequelize.STRING(512),
        unique: true
      },
      keyType: {
        allowNull: false,
        type: Sequelize.STRING(32)
      },
      failureCount: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lockedUntil: {
        allowNull: true,
        type: Sequelize.DATE
      },
      firstFailureAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      lastFailureAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
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

    await queryInterface.addIndex('login_attempts', ['keyType', 'lockedUntil'], {
      name: 'login_attempts_type_locked_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('login_attempts');
  }
};
