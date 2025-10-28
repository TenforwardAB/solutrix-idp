'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('whitelisted_tokens', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      token_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
        validate: {
          isIn: [['ACCESS', 'REFRESH', 'OTHER']],
        },
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    // Create the function to remove expired tokens
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION remove_expired_tokens() RETURNS trigger AS $$
      BEGIN
        DELETE FROM whitelisted_tokens WHERE expires_at < NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER after_token_insert_cleanup
      AFTER INSERT ON whitelisted_tokens
      FOR EACH ROW
      EXECUTE FUNCTION remove_expired_tokens();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS after_token_insert_cleanup ON whitelisted_tokens;
    `);

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS remove_expired_tokens;
    `);

    await queryInterface.dropTable('whitelisted_tokens');
  },
};

