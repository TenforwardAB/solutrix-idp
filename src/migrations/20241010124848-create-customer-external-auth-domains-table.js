'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_external_auth_domains', {
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
      email_domain: {
        type: Sequelize.STRING(255),
        allowNull: false
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

    // Add unique constraint for customer_id and email_domain
    await queryInterface.addConstraint('customer_external_auth_domains', {
      fields: ['customer_id', 'email_domain'],
      type: 'unique',
      name: 'unique_customer_email_domain'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customer_external_auth_domains');
  }
};
