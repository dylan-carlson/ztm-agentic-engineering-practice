const Database = require('better-sqlite3');
const { DB_PATH } = require('../config');

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : DB_PATH;
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = { db };
