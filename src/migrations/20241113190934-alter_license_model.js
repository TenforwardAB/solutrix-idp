'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the "duration" column
    await queryInterface.removeColumn('license_model', 'duration');

    // Add the new columns
    await queryInterface.addColumn('license_model', 'valid_to', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('license_model', 'max_reviews', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn('license_model', 'license_limit_type', {
      type: Sequelize.STRING(4),
      allowNull: false,
      defaultValue: 'soft',
    });

    await queryInterface.addColumn('license_model', 'active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    // Add a unique constraint on (customerid, active)
    await queryInterface.addConstraint('license_model', {
      fields: ['customerid', 'active'],
      type: 'unique',
      name: 'unique_active_license_per_customer',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse the changes by removing the added columns and constraint
    await queryInterface.removeConstraint('license_model', 'unique_active_license_per_customer');
    await queryInterface.removeColumn('license_model', 'active');
    await queryInterface.removeColumn('license_model', 'license_limit_type');
    await queryInterface.removeColumn('license_model', 'max_reviews');
    await queryInterface.removeColumn('license_model', 'valid_to');

    // Add back the "duration" column
    await queryInterface.addColumn('license_model', 'duration', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
