'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('rescue_email_mappings', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      rescue_mail: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

     await queryInterface.addConstraint('rescue_email_mappings', {
       fields: ['rescue_mail'],
       type: 'check',
       where: {
         rescue_mail: {
           [Sequelize.Op.regexp]: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
         }
       },
       name: 'rescue_email_format_check'
     });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('rescue_email_mappings');
  }
};
