const path = require('path');
const Database = require('better-sqlite3');

// Render (e outros hosts) geralmente permitem escrita só em /tmp no free.
// Então colocamos o banco em /tmp pra não quebrar.
const dbPath = process.env.DB_PATH || path.join('/tmp', 'bg-finance.db');

const db = new Database(dbPath);

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    amount REAL,
    type TEXT,
    user_id INTEGER,
    date TEXT
  );
`);

module.exports = db;