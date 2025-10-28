'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add external_auth column to customer table
    await queryInterface.addColumn('customer', 'external_auth', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove external_auth column from customer table
    await queryInterface.removeColumn('customer', 'external_auth');
  }
};
