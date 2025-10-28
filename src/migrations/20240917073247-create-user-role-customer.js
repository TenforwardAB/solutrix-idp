'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_role_customer', {
      userrolecustomerid: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userid: {
        type: Sequelize.CHAR(24),
        allowNull: false,
        unique: true,
      },
      roleid: {
        type: Sequelize.CHAR(4),
        references: {
          model: 'role',
          key: 'roleid',
        },
      },
      customerid: {
        type: Sequelize.UUID,
        references: {
          model: 'customer',
          key: 'customerid',
        },
      },
      assigneddate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('user_role_customer', {
      type: 'unique',
      fields: ['userid', 'roleid', 'customerid'],
      name: 'unique_user_role_customer',
    });

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION check_admiral_superadmin() RETURNS TRIGGER AS $$
      BEGIN
        IF (NEW.roleid = (SELECT roleid FROM role WHERE rolename = 'Admiral')) THEN
          IF NOT EXISTS (
            SELECT 1 FROM customer WHERE customerid = NEW.customerid AND allow_superadmin = TRUE
          ) THEN
            RAISE EXCEPTION 'Not allowed to have superadmins';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER check_admiral_insert
      BEFORE INSERT ON user_role_customer
      FOR EACH ROW
      EXECUTE FUNCTION check_admiral_superadmin();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS check_admiral_insert ON user_role_customer;
    `);
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS check_admiral_superadmin;
    `);
    await queryInterface.dropTable('user_role_customer');
  }
};
