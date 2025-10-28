'use strict';

module.exports = {

  up: async (queryInterface, Sequelize) => {
    // Temporarily remove the primary key constraint on 'edgerunnerid'
    await queryInterface.removeConstraint('edgerunner', 'edgerunner_pkey');

    // Update 'edgerunnerid' to use uuid_generate_v4() as the default value
    await queryInterface.changeColumn('edgerunner', 'edgerunnerid', {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
    });

    // Re-add the primary key constraint on 'edgerunnerid'
    await queryInterface.addConstraint('edgerunner', {
      fields: ['edgerunnerid'],
      type: 'primary key',
      name: 'edgerunner_pkey',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the primary key constraint on 'edgerunnerid'
    await queryInterface.removeConstraint('edgerunner', 'edgerunner_pkey');

    // Revert 'edgerunnerid' to not have a default value
    await queryInterface.changeColumn('edgerunner', 'edgerunnerid', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    // Re-add the primary key constraint on 'edgerunnerid'
    await queryInterface.addConstraint('edgerunner', {
      fields: ['edgerunnerid'],
      type: 'primary key',
      name: 'edgerunner_pkey',
    });
  },
};
