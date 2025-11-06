#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const name = process.argv[2];
if (!name) process.exit(1);

const pad = n => String(n).padStart(2, '0');
const d = new Date();
const ts = [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    pad(d.getUTCSeconds()),
].join('');
const file = `${ts}-${name}.js`;
const dir = path.join(process.cwd(), 'src', 'migrations');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const tpl = `'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
  },

  async down(queryInterface, Sequelize) {
  },
};
`;
fs.writeFileSync(path.join(dir, file), tpl);
console.log(path.join('src', 'migrations', file));
