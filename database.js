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

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_chat_id_key ON users (telegram_chat_id) WHERE telegram_chat_id IS NOT NULL`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS telegram_links (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash CHAR(64) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS debts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      kind VARCHAR(20) NOT NULL CHECK (kind IN ('credit_card', 'loan', 'other')),
      amount NUMERIC(12,2) NOT NULL,
      due_date DATE,
      notes VARCHAR(240),
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      cycle VARCHAR(20) NOT NULL CHECK (cycle IN ('monthly', 'yearly')),
      amount NUMERIC(12,2) NOT NULL,
      due_date DATE,
      notes VARCHAR(240),
      active BOOLEAN NOT NULL DEFAULT TRUE,
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
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash CHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const renames = [
    ['Salario', 'Salário', 'income'],
    ['Alimentacao', 'Alimentação', 'expense'],
    ['Saude', 'Saúde', 'expense'],
    ['Educacao', 'Educação', 'expense'],
  ];
  for (const [from, to, type] of renames) {
    await pool.query(
      `UPDATE categories
       SET name = $1
       WHERE user_id IS NULL AND type = $2 AND name = $3
         AND NOT EXISTS (
           SELECT 1 FROM categories c
           WHERE c.user_id IS NULL AND c.type = $2 AND c.name = $1
         )`,
      [to, type, from]
    );
  }

  await pool.query(`
    INSERT INTO categories (name, type, user_id)
    SELECT name, type, NULL
    FROM (
      VALUES
        ('Salário', 'income'),
        ('Freelance', 'income'),
        ('Investimentos', 'income'),
        ('Benefícios', 'income'),
        ('Reembolso', 'income'),
        ('Extra', 'income'),
        ('Outros', 'income'),
        ('Alimentação', 'expense'),
        ('Moradia', 'expense'),
        ('Contas', 'expense'),
        ('Transporte', 'expense'),
        ('Saúde', 'expense'),
        ('Educação', 'expense'),
        ('Lazer', 'expense'),
        ('Assinaturas', 'expense'),
        ('Compras', 'expense'),
        ('Pets', 'expense'),
        ('Cuidados', 'expense'),
        ('Impostos', 'expense'),
        ('Trabalho', 'expense'),
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
