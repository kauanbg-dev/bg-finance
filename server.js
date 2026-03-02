const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'bg-finance-secret';

// ==============================
// SERVIR FRONTEND
// ==============================
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ==============================
// MIDDLEWARE JWT
// ==============================
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

// ==============================
// AUTH
// ==============================
app.post('/auth/register', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Preencha email e senha' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha muito curta (mín. 6 caracteres)' });
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    stmt.run(email, hash);
    res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }
});

app.post('/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// ==============================
// TRANSACTIONS
// ==============================
app.get('/transactions', authenticateToken, (req, res) => {
  const month = req.query.month;

  try {
    if (month) {
      const rows = db.prepare(`
        SELECT * FROM transactions
        WHERE user_id = ?
          AND substr(date, 1, 7) = ?
        ORDER BY date DESC
      `).all(req.user.id, month);
      return res.json(rows);
    }

    const rows = db.prepare(`
      SELECT * FROM transactions
      WHERE user_id = ?
      ORDER BY date DESC
    `).all(req.user.id);

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

app.post('/transactions', authenticateToken, (req, res) => {
  const description = String(req.body.description || '').trim();
  const amount = Number(req.body.amount);
  const type = String(req.body.type || '').trim();

  if (!description || Number.isNaN(amount) || (type !== 'income' && type !== 'expense')) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (description, amount, type, user_id, date)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    const info = stmt.run(description, amount, type, req.user.id);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

app.put('/transactions/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const description = String(req.body.description || '').trim();
  const amount = Number(req.body.amount);
  const type = String(req.body.type || '').trim();

  if (!id || !description || Number.isNaN(amount) || (type !== 'income' && type !== 'expense')) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE transactions
      SET description = ?, amount = ?, type = ?
      WHERE id = ? AND user_id = ?
    `);
    const info = stmt.run(description, amount, type, id, req.user.id);
    res.json({ updated: info.changes });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao editar transação' });
  }
});

app.delete('/transactions/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);

  try {
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, req.user.id);
    res.json({ deleted: info.changes });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

// ==============================
// START
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));