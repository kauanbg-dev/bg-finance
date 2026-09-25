# BG Finance

Controle de receitas e despesas com login, gráficos e exportação CSV.

**Deploy:** [bg-finance.onrender.com](https://bg-finance.onrender.com/)

## Stack

- Node.js + Express
- PostgreSQL (Neon)
- HTML, CSS e JavaScript no `frontend/`

## O que tem

- Cadastro e login (JWT)
- Receitas e despesas com categoria e data
- Filtros, ordenação e CSV
- Gráficos de fluxo, categoria e evolução

## Subir local

```bash
cp .env.example .env
# preenche DATABASE_URL e JWT_SECRET
npm install
npm start
```

No Render, coloca as mesmas variáveis no painel do serviço. O `.env` não entra no git.
