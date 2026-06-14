'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admin_audit_events', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      actorSubject: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      actorEmail: {
        type: Sequelize.STRING(320),
        allowNull: true
      },
      customerId: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      action: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      targetType: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      targetId: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      authType: {
        type: Sequelize.STRING(32),
        allowNull: false
      },
      ip: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
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

    await queryInterface.addIndex('admin_audit_events', ['customerId', 'createdAt'], {
      name: 'admin_audit_events_customerId_createdAt_idx',
    });
    await queryInterface.addIndex('admin_audit_events', ['actorSubject', 'createdAt'], {
      name: 'admin_audit_events_actorSubject_createdAt_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('admin_audit_events');
  }
};
