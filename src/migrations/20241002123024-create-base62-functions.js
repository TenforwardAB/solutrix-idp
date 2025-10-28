'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Function to encode bytea into base62
      CREATE OR REPLACE FUNCTION base62_encode(val bytea) RETURNS text AS $$
      DECLARE
          base62_chars text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
          output text := '';
          i int;
          idx int;
      BEGIN
          FOR i IN 0..length(val) - 1 LOOP
              idx := get_byte(val, i);
              output := output || substr(base62_chars, idx % 62 + 1, 1);
          END LOOP;
          RETURN output;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to generate a short base62 encoded ID
      CREATE OR REPLACE FUNCTION generate_short_id() RETURNS text AS $$
      BEGIN
          RETURN base62_encode(gen_random_bytes(20));
      END;
      $$ LANGUAGE plpgsql;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Drop the functions if rolling back
      DROP FUNCTION IF EXISTS generate_short_id();
      DROP FUNCTION IF EXISTS base62_encode();
    `);
  }
};
