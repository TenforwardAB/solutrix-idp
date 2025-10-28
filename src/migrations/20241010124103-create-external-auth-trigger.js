'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the trigger function
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_external_auth_flag()
      RETURNS TRIGGER AS $$
      BEGIN
          IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
              UPDATE public.customer
              SET external_auth = true
              WHERE customerid = NEW.customer_id;
          END IF;

          IF (TG_OP = 'DELETE') THEN
              IF NOT EXISTS (
                  SELECT 1 FROM public.customer_auth_config
                  WHERE customer_id = OLD.customer_id
              ) THEN
                  UPDATE public.customer
                  SET external_auth = false
                  WHERE customerid = OLD.customer_id;
              END IF;
          END IF;

          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create the trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_external_auth_trigger
      AFTER INSERT OR UPDATE OR DELETE
      ON public.customer_auth_config
      FOR EACH ROW
      EXECUTE FUNCTION update_external_auth_flag();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the trigger
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_external_auth_trigger ON public.customer_auth_config;
    `);

    // Drop the trigger function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS update_external_auth_flag();
    `);
  }
};
