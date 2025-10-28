'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_activity_log_userid_status_createdat
      ON public.activity_log (userid, (activity_info->>'status'), "createdAt" DESC);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_activity_log_userid_status_createdat;
    `);
  }
};
