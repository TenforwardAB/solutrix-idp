'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_permissions', {
      rolepermissionid: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      rolename: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'role',
          key: 'rolename',
        },
        onDelete: 'CASCADE',
      },
      permissions: {
        type: Sequelize.JSONB,
        allowNull: false,
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.bulkInsert('role_permissions', [
      { rolename: 'Admiral', permissions: '{\n' +
            '    "dns_servers": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "dns_zones": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "dns_metadata": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "dns_cache": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "dns_statistics": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "dns_cryptokeys": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "dns_searching": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "dns_tsigkeys": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "dns_autoprimaries": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_addresslisting": {\n' +
            '        "read:any": ["*"]\n' +
            '    },\n' +
            '    "mail_addresses": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_authentication": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"]\n' +
            '    },\n' +
            '    "mail_userlisting": {\n' +
            '        "read:any": ["*"]\n' +
            '    },\n' +
            '    "mail_users": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_asps": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_messages": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_attachments": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_storage": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_mailboxes": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_autoreplies": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_filters": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_certs": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_dkim": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_domainaccess": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_domainaliases": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_webhooks": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    },\n' +
            '    "mail_settings": {\n' +
            '        "create:any": ["*"],\n' +
            '        "read:any": ["*"],\n' +
            '        "update:any": ["*"],\n' +
            '        "delete:any": ["*"]\n' +
            '    }\n' +
            '}', createdAt: new Date(), updatedAt: new Date() },

    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role_permissions');
  },
};
