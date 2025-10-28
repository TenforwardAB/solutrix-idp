'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('edgerunner', {
      edgerunnerid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      customerid: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customer',
          key: 'customerid',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      licensekeyid: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'license_keys',
          key: 'licensekeyid',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      hwkey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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
    await queryInterface.dropTable('edgerunner');
  },
};
