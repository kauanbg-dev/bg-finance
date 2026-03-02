const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'bg-finance-secret';

// SERVIR FRONTEND
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota raiz -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// BANCO
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      amount REAL,
      type TEXT,
      user_id INTEGER,
      date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      token_hash TEXT,
      expires_at INTEGER,
      used INTEGER DEFAULT 0
    )
  `);
});

// MIDDLEWARE JWT
function authenticateToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token ausente' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// AUTH
// REGISTER

if (typeof password !== 'string' || password.length < 6) {
  return res.status(400).json({ error: 'Senha muito curta (mín. 6 caracteres).' });
}

app.post('/auth/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Preencha email e senha' });

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (email, password) VALUES (?, ?)`,
    [email.trim().toLowerCase(), hash],
    function (err) {
      if (err) return res.status(400).json({ error: 'Email já cadastrado' });
      res.json({ ok: true });
    }
  );
});

// LOGIN
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email.trim().toLowerCase()],
    (err, user) => {
      if (err || !user)
        return res.status(401).json({ error: 'Credenciais inválidas' });

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid)
        return res.status(401).json({ error: 'Credenciais inválidas' });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ token });
    }
  );
});

// FORGOT PASSWORD
app.post('/auth/forgot', (req, res) => {
  const { email } = req.body;

  db.get(
    `SELECT id FROM users WHERE email = ?`,
    [email.trim().toLowerCase()],
    (err, user) => {
      if (!user) return res.json({ ok: true });

      const tokenPlain = crypto.randomBytes(24).toString('hex');
      const tokenHash = sha256(tokenPlain);
      const expiresAt = Date.now() + 1000 * 60 * 30;

      db.run(
        `INSERT INTO reset_tokens (user_id, token_hash, expires_at, used)
         VALUES (?, ?, ?, 0)`,
        [user.id, tokenHash, expiresAt],
        () => {
          // modo dev
          res.json({ ok: true, dev_token: tokenPlain });
        }
      );
    }
  );
});


// TRANSACTIONS
app.get('/transactions', authenticateToken, (req, res) => {
  const { month } = req.query;

  if (month) {
    db.all(
      `SELECT * FROM transactions
       WHERE user_id = ?
       AND substr(date, 1, 7) = ?
       ORDER BY date DESC`,
      [req.user.id, month],
      (err, rows) => {
        res.json(rows || []);
      }
    );
  } else {
    db.all(
      `SELECT * FROM transactions
       WHERE user_id = ?
       ORDER BY date DESC`,
      [req.user.id],
      (err, rows) => {
        res.json(rows || []);
      }
    );
  }
});

app.post('/transactions', authenticateToken, (req, res) => {
  const { description, amount, type } = req.body;

  db.run(
    `INSERT INTO transactions (description, amount, type, user_id, date)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [description, amount, type, req.user.id],
    function (err) {
      res.json({ id: this.lastID });
    }
  );
});

app.put('/transactions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { description, amount, type } = req.body;

  db.run(
    `UPDATE transactions
     SET description = ?, amount = ?, type = ?
     WHERE id = ? AND user_id = ?`,
    [description, amount, type, id, req.user.id],
    function () {
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/transactions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM transactions WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    function () {
      res.json({ deleted: this.changes });
    }
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});