'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('oidc_clients', 'customerId', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('oidc_clients', 'createdBySubject', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('oidc_clients', 'createdByEmail', {
      type: Sequelize.STRING(320),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addIndex('oidc_clients', ['customerId'], {
      name: 'oidc_clients_customerId_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('oidc_clients', 'oidc_clients_customerId_idx');
    await queryInterface.removeColumn('oidc_clients', 'createdByEmail');
    await queryInterface.removeColumn('oidc_clients', 'createdBySubject');
    await queryInterface.removeColumn('oidc_clients', 'customerId');
  }
};
