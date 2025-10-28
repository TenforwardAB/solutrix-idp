'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update the role names
    await queryInterface.bulkUpdate('role', { rolename: 'user' }, { rolename: 'Ensign' });
    await queryInterface.bulkUpdate('role', { rolename: 'moderator' }, { rolename: 'Lieutenant' });
    await queryInterface.bulkUpdate('role', { rolename: 'customeradmin' }, { rolename: 'Commander' });
    await queryInterface.bulkUpdate('role', { rolename: 'customerdeveloper' }, { rolename: 'Captain' });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the role names back to the original ones
    await queryInterface.bulkUpdate('role', { rolename: 'Ensign' }, { rolename: 'user' });
    await queryInterface.bulkUpdate('role', { rolename: 'Lieutenant' }, { rolename: 'moderator' });
    await queryInterface.bulkUpdate('role', { rolename: 'Commander' }, { rolename: 'customeradmin' });
    await queryInterface.bulkUpdate('role', { rolename: 'Captain' }, { rolename: 'customerdeveloper' });
  }
};
