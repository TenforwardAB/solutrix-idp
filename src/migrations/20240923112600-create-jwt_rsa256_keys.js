'use strict';
const { Buffer } = require('buffer');

// Function to convert PEM to Base64

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
      customerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customer',
          key: 'customerid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Insert your current public and private keys
    const publicKeyPEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3Aoxwc8j3jhX8kIsWlvw
u4KYzsrytJOVKH5G5ydyWmA2hkIJTDHdSsz4fUr4ZRkFeuCDF6fNPKPNYGgil43W
tWh34chVXTnvKYdAZ74qtldQe8TtvEHwC3RQBXEnqMVE9Sbl+qluPCrIcoWsqLsy
UqkxKdwQmivka9Q2ez5JpTvB5CPSPmGdMZeaGmd9KFW+ntW2L8vQLMAXOjj6ww2c
U6SXaJYLgsdqbma75P0mqiBm8hhdSKT36O3SuIhqwXI0Cqa+SW5IrvhFu0aONG9p
yQHQgaTJCbtui4NUyPp2BdJKPRNc6eIiVrJkobvzRxUp1ijnsU7RBbIT+bWtFqoM
bwIDAQAB
-----END PUBLIC KEY-----
    `;
    const privateKeyPEM = `------BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcCjHBzyPeOFfy
QixaW/C7gpjOyvK0k5UofkbnJ3JaYDaGQglMMd1KzPh9SvhlGQV64IMXp808o81g
aCKXjda1aHfhyFVdOe8ph0Bnviq2V1B7xO28QfALdFAFcSeoxUT1JuX6qW48Kshy
hayouzJSqTEp3BCaK+Rr1DZ7PkmlO8HkI9I+YZ0xl5oaZ30oVb6e1bYvy9AswBc6
OPrDDZxTpJdolguCx2puZrvk/SaqIGbyGF1IpPfo7dK4iGrBcjQKpr5Jbkiu+EW7
Ro40b2nJAdCBpMkJu26Lg1TI+nYF0ko9E1zp4iJWsmShu/NHFSnWKOexTtEFshP5
ta0WqgxvAgMBAAECggEAPKxW8gEC++h/X56dikDlzV6CcisF54L2UxcWx/BZmNAE
2Npmo+rwAQspzaqZeY7/stUrcJ9leT4ViGrOdwm2VYk73TcXSsCJ0OKpgLGwJ11G
JQq1Hv7ziMUGt6lu7RuQGyUhrw9/BPorEWEIrfIIO0DJ/KfgsBJARvdaGnufZP7l
W12Ymwr1ECELEENuDleVyEKkV7IJtgBcZPw2Xd5HixReedrPxeVT5BAHFQ4hnEku
hzxDbKDQRM15uT1vOYRx3e4ek3qGqwpCU5DgmHNoFtDE2DRui0GBsAjc0/HQUb7m
W40cnhoftOK2UU8IDbLRkG1uGnneEoBHC1P5JrK5mQKBgQDo60IZBpJWANgt00ME
G/ZmO8uNApbnuMcgrDKibpMqcePuPpdqOvvJRT16oItXf399q/dn9TZeMYXAgbRF
SO3w6Qf3+ZYoAPXfnCiD82PASbl6yPGculk2XxL9B2vnykYQrD3baNxUL+7778wr
cJVHy3KNow8HfVi92YoyASSDUwKBgQDx2Db9u0eQIbc7afEzSEXYFaD3mpDBwACU
OKZZUgv0qRMEG9pBkAc3WMogOvM5OVmve8eWcPcqXDitYdXh2wF5HSwTptL7spJs
RbB9S1guWJUFp1ea+2QE9F/0TAJ1/G7/jFYtJ5DdZO73tDoFc34mpV3KWoVr1Mkd
hcVHK0hq9QKBgAGn+pZW959o7iCVSfqzgDMF5dKg3BXVuITA9LM2+hDpMme1RjpZ
JQUvWtqOXa9Hls579Ixmr/ZHf934jiGX/SkjXw0iVzD9oMHwSFF335O0cn8vApjM
smmyj14BOYEybQEdWGtA+aAXnylncRo1+LnD9pKPQEIbYBAphdQJMgtFAoGAG1zi
Q+0HmMgnyiIfdzTrKhqwXrNvQ2ys5BhQwfRlg+YJT8Ky/A4Gsv1pySHCWSwi+Jbh
qyTW4kUS6JMUNvynewOQ9BxA7Nd0d6me4V4/+OZu3ffkEpX06BaaMLLU6HKKQIGp
UmySmGoOG5qZofpCQK8fIIEDbYLiymNTQc0k4W0CgYEA4B7Hbg5AqApNSsb99xz/
dcwvetaItncWi84SE3o0IvBhKkBPgFwyKHNpow47OqIbdDifDKsygZnGC3vNEPtd
cBbjnsm47xrEZpX1iPYoxmZUvikhYUiTOIawUxtEjsq+cLNfO+GN9ZO958CMvrCI
B4YTPtDTdbOtT03W3+JAAKc=
-----END PRIVATE KEY-----
    `;

    await queryInterface.bulkInsert('jwt_rsa256_keys', [{
      publicKey: publicKeyPEM,
      privateKey: privateKeyPEM,
      customerId: null,
      isInvalid: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
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
