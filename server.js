const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = require('./database');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const JWT_SECRET = process.env.JWT_SECRET || 'bg-finance-secret';

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Token invalido' });
  }
}

function normalizeAuthInput(body) {
  return {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    password: String(body.password || ''),
  };
}

/* =========================
   AUTH
========================= */

async function register(req, res) {
  const { name, email, password } = normalizeAuthInput(req.body);

  // validação obrigatória
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha nome, email e senha' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha muito curta (min. 6 caracteres)' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hash] // 👈 SEM null aqui
    );

    return res.json({ ok: true });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email ja cadastrado' });
    }

    console.error('Erro ao cadastrar usuario:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar usuario' });
  }
}
async function login(req, res) {
  const { email, password } = normalizeAuthInput(req.body);

  try {
    const result = await db.query(
      'SELECT id, name, email, password FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}

/* =========================
   ROUTES BASE
========================= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.post('/auth/register', register);
app.post('/register', register);
app.post('/auth/login', login);
app.post('/login', login);

/* =========================
   USER
========================= */

app.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar usuario:', err);
    return res.status(500).json({ error: 'Erro ao buscar usuario' });
  }
});

/* =========================
   CATEGORIES
========================= */

app.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, type, user_id
       FROM categories
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY type ASC, name ASC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    return res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

app.post('/categories', authenticateToken, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const type = String(req.body.type || '').trim();

  if (!name || (type !== 'income' && type !== 'expense')) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const result = await db.query(
      `INSERT INTO categories (name, type, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, type, user_id`,
      [name, type, req.user.id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Categoria ja cadastrada' });
    }

    console.error('Erro ao criar categoria:', err);
    return res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

/* =========================
   TRANSACTIONS
========================= */

app.get('/transactions', authenticateToken, async (req, res) => {
  const month = String(req.query.month || '').trim();

  try {
    let params = [req.user.id];
    let monthFilter = '';

    if (month) {
      params.push(month);
      monthFilter = `AND TO_CHAR(t.date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') = $${params.length}`;
    }

    const result = await db.query(
      `SELECT
         t.id,
         t.description,
         t.amount,
         t.type,
         t.user_id,
         t.category_id,
         c.name AS category_name,
         t.date
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ${monthFilter}
       ORDER BY t.date DESC, t.id DESC`,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar transacoes:', err);
    return res.status(500).json({ error: 'Erro ao listar transacoes' });
  }
});

app.post('/transactions', authenticateToken, async (req, res) => {
  const description = String(req.body.description || '').trim();
  const amount = Number(req.body.amount);
  const type = String(req.body.type || '').trim();

  const categoryId =
    req.body.category_id !== undefined && req.body.category_id !== null
      ? Number(req.body.category_id)
      : null;

  if (!description || Number.isNaN(amount) || (type !== 'income' && type !== 'expense')) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const result = await db.query(
      `INSERT INTO transactions (description, amount, type, user_id, category_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [description, amount, type, req.user.id, categoryId]
    );

    return res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Erro ao criar transacao:', err);
    return res.status(500).json({ error: 'Erro ao criar transacao' });
  }
});

app.put('/transactions/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const description = String(req.body.description || '').trim();
  const amount = Number(req.body.amount);
  const type = String(req.body.type || '').trim();

  const categoryId =
    req.body.category_id !== undefined && req.body.category_id !== null
      ? Number(req.body.category_id)
      : null;

  if (!id || !description || Number.isNaN(amount) || (type !== 'income' && type !== 'expense')) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const result = await db.query(
      `UPDATE transactions
       SET description = $1,
           amount = $2,
           type = $3,
           category_id = $4
       WHERE id = $5 AND user_id = $6`,
      [description, amount, type, categoryId, id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transacao nao encontrada' });
    }

    return res.json({ updated: result.rowCount });
  } catch (err) {
    console.error('Erro ao editar transacao:', err);
    return res.status(500).json({ error: 'Erro ao editar transacao' });
  }
});

app.delete('/transactions/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Dados invalidos' });
  }

  try {
    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transacao nao encontrada' });
    }

    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Erro ao deletar transacao:', err);
    return res.status(500).json({ error: 'Erro ao deletar transacao' });
  }
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;

db.initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao iniciar banco:', err);
    process.exit(1);
  });