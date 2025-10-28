'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('role', {
      roleid: {
        type: Sequelize.CHAR(4),
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      rolename: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.bulkInsert('role', [
      { roleid: '76FA', rolename: 'Crewman', description: 'Normal user with basic permissions', createdAt: new Date(), updatedAt: new Date() },
      { roleid: 'CF4D', rolename: 'Specialist', description: 'Advanced user with elevated permissions', createdAt: new Date(), updatedAt: new Date() },
      { roleid: '7825', rolename: 'Operations_Manager', description: 'Moderator with management capabilities', createdAt: new Date(), updatedAt: new Date() },
      { roleid: '9FFC', rolename: 'Captain', description: 'Administrator with full access to system configurations', createdAt: new Date(), updatedAt: new Date() },
      { roleid: '00F1', rolename: 'Admiral', description: 'Super Administrator with complete system control', createdAt: new Date(), updatedAt: new Date() },
      { roleid: 'A001', rolename: 'Station_Admin', description: 'Can manage all aspects of their assigned customer account', createdAt: new Date(), updatedAt: new Date() },
      { roleid: 'A002', rolename: 'Technical_Officer', description: 'Can perform technical operations for their assigned customer account', createdAt: new Date(), updatedAt: new Date() },
      { roleid: 'A003', rolename: 'Finance_Officer', description: 'Can manage account-related operations such as adding deposit accounts for their assigned customer account', createdAt: new Date(), updatedAt: new Date() },
      { roleid: 'A004', rolename: 'Invoice_Clerk', description: 'Can handle invoices for their assigned customer account', createdAt: new Date(), updatedAt: new Date() },
      { roleid: 'A005', rolename: 'Crewman_User', description: 'A regular user with limited permissions, can read their own email and perform basic tasks', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('role');
  }
};
