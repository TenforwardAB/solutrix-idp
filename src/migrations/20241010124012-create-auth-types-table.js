'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('auth_types', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      auth_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
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

    // Insert initial data into auth_types
    await queryInterface.bulkInsert('auth_types', [
      { auth_name: 'OAuth', description: 'OAuth 2.0 authentication', createdAt: new Date(), updatedAt: new Date() },
      { auth_name: 'OpenID', description: 'OpenID Connect built on OAuth 2.0', createdAt: new Date(), updatedAt: new Date() },
      { auth_name: 'SAML', description: 'SAML 2.0 authentication', createdAt: new Date(), updatedAt: new Date() },
      { auth_name: 'LocalDB', description: 'Local database-based authentication', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('auth_types');
  }
};
