'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      INSERT INTO customer
        ("customerid","customername","createdAt","updatedAt","allow_superadmin","external_auth")
      VALUES
        (
          '00000000-0000-0000-0000-000000000000',
          'Mailtrix Private Account',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          false,
          false
        )
      ON CONFLICT (customerid) DO NOTHING;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DELETE FROM customer
      WHERE customerid = '00000000-0000-0000-0000-000000000000';
    `);
  },
};
