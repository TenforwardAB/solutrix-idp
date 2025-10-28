'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('whitelisted_tokens', ['token'], {
      name: 'whitelisted_tokens_token_hash_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('whitelisted_tokens', 'whitelisted_tokens_token_hash_idx');
  },
};
