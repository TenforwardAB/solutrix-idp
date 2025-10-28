'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('verify_codes', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      type: {
        type: Sequelize.ENUM('mail', 'phone'),
        allowNull: false,
      },
      target: {
        // email address or phone number
        type: Sequelize.STRING,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    // 1) Create the function that deletes expired verify_codes
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION remove_expired_verify_codes() RETURNS trigger AS $$
      BEGIN
        DELETE FROM verify_codes
        WHERE "expiresAt" < NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2) Create a trigger that fires after each insert on verify_codes
    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_verify_code_insert_cleanup
      AFTER INSERT ON verify_codes
      FOR EACH ROW
      EXECUTE FUNCTION remove_expired_verify_codes();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('verify_codes');

    // 1) Drop the trigger if it exists
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS after_verify_code_insert_cleanup ON verify_codes;
    `);

    // 2) Drop the cleanup function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS remove_expired_verify_codes;
    `);
  },
};
