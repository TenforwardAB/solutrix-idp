'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('failed_logins', {
      loginid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      userid: {
        type: Sequelize.CHAR(24),
        allowNull: false,
        unique: true, // Varje `userid` kan endast ha en rad
      },
      fail_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0, // Börjar från 0
      },
      last_failed_at: {
        type: Sequelize.DATE,
        allowNull: true, // Null om inga misslyckade inloggningar har skett
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('failed_logins');
  }
};
