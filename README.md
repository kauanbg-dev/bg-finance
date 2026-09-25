# BG Finance

Sistema de controle financeiro com login, categorias, gráficos e exportação CSV.

**Ao vivo:** [bg-finance.onrender.com](https://bg-finance.onrender.com/)

## Funcionalidades

- Cadastro e login (JWT)
- Receitas e despesas com categoria e data
- Filtros, ordenação e exportação CSV
- Gráficos de fluxo mensal, categoria e evolução

## Stack

- Node.js + Express
- PostgreSQL (Neon)
- HTML, CSS e JavaScript (`frontend/`)

## Como rodar

```bash
cp .env.example .env
# preenche DATABASE_URL e JWT_SECRET
npm install
npm start
```

No Render, configure as mesmas variáveis no painel do serviço. O arquivo `.env` não entra no git.
