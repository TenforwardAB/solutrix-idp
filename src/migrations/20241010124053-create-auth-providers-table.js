'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('auth_providers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      provider_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      auth_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_types',
          key: 'id'
        },
        onDelete: 'CASCADE'
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

    // Insert initial data into auth_providers
    await queryInterface.bulkInsert('auth_providers', [
      { provider_name: 'Google', auth_type_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { provider_name: 'Entra', auth_type_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { provider_name: 'Local', auth_type_id: 4, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('auth_providers');
  }
};
