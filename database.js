require('dotenv').config();

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL nao definida no .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log('Conectado no PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro no pool PostgreSQL:', err);
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, name, type)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      date TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO categories (name, type, user_id)
    SELECT name, type, NULL
    FROM (
      VALUES
        ('Salario', 'income'),
        ('Investimentos', 'income'),
        ('Outros', 'income'),
        ('Alimentacao', 'expense'),
        ('Moradia', 'expense'),
        ('Transporte', 'expense'),
        ('Lazer', 'expense'),
        ('Outros', 'expense')
    ) AS defaults(name, type)
    WHERE NOT EXISTS (
      SELECT 1
      FROM categories c
      WHERE c.user_id IS NULL
        AND c.name = defaults.name
        AND c.type = defaults.type
    );
  `);
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDatabase,
};