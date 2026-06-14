'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('jwt_rsa256_keys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      publicKey: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      privateKey: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      keyId: {
        type: Sequelize.STRING(8),
        unique: true,
        allowNull: false,  // Make sure it's not nullable
      },
      validUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isInvalid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Create the trigger function for generating "keyId"
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION generate_key_id() RETURNS TRIGGER AS $$
      BEGIN
       NEW."keyId" := RIGHT(ENCODE(DIGEST(NEW."publicKey", 'sha256'), 'hex'), 8); 
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create the trigger to automatically set "keyId" before insert
    await queryInterface.sequelize.query(`
      CREATE TRIGGER set_key_id
      BEFORE INSERT ON jwt_rsa256_keys
      FOR EACH ROW
      EXECUTE FUNCTION generate_key_id();
    `);

    // Signing keys are intentionally not seeded here. The application can create
    // the first encrypted key at startup when OIDC_AUTO_GENERATE_SIGNING_KEY=true.
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS set_key_id ON jwt_rsa256_keys;
    `);

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS generate_key_id;
    `);

    await queryInterface.dropTable('jwt_rsa256_keys');
  }
};
