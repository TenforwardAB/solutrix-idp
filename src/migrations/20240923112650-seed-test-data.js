'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query(
            `
      DO $$
      DECLARE
          new_customerid UUID;
          new_userid TEXT;
          admiral_roleid INTEGER;
      BEGIN
          INSERT INTO public.pricing_model (modelname, description, cost)
          VALUES ('Basic', 'Basic pricing model', 10.00);

          -- Insert the customer and get the customerid (UUID)
          INSERT INTO public.customer (customerid, customername, address, phonenumber, email, pricingmodelid, allow_superadmin)
          VALUES ('1d3b32c4-e940-4ebb-bf2a-c64a97fd3c7b', 'Starfleet HQ', '1701 Enterprise St.', '123-456-7890', 'hq@starfleet.com', 1, true)
          RETURNING customerid INTO new_customerid;

          -- Insert into user_role_customer using the retrieved customerid
          INSERT INTO public.user_role_customer (userid, roleid, customerid, assigneddate)
          VALUES ('673e6f9af5c0a0006080f843', '00F1', new_customerid, CURRENT_TIMESTAMP);
      END $$;
    `
        );
    },

    down: async (queryInterface, Sequelize) => {

        await queryInterface.sequelize.query(
            `
      DO $$
      BEGIN
          -- Remove the user_role_customer entry
          DELETE FROM public.user_role_customer
          WHERE userid = '673e6f9af5c0a0006080f843'
          AND roleid = '00F1'
          AND customerid = '1d3b32c4-e940-4ebb-bf2a-c64a97fd3c7b';

          -- Remove the customer entry
          DELETE FROM public.customer
          WHERE customerid = '1d3b32c4-e940-4ebb-bf2a-c64a97fd3c7b';

          -- Remove the pricing model entry
          DELETE FROM public.pricing_model
          WHERE modelname = 'Basic';
      END $$;
    `
        );
    },
};
