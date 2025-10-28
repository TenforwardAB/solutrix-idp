'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Alter the edgerunnerid column to use uuid_generate_v4() as the default value
    await queryInterface.changeColumn('edgerunner', 'edgerunnerid', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
      allowNull: false,
      primaryKey: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the edgerunnerid column to a simple UUID without default
    await queryInterface.changeColumn('edgerunner', 'edgerunnerid', {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
    });
  },
};
