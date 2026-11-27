# BG Finance

Controle financeiro pessoal: saldo, cartões, dívidas, assinaturas, investimentos e gráficos no mesmo lugar.

**Ao vivo:** [bg-finance.onrender.com](https://bg-finance.onrender.com/)

## Funcionalidades

- Cadastro e login (JWT), recuperação de senha e confirmação por e-mail
- Entrar com Google (opcional)
- Painel de receitas e despesas com categoria, filtros, ordenação e exportação CSV
- Gráficos de fluxo mensal, categoria, mix e evolução diária
- Cartões de crédito com limite, fatura e extrato de compras
- Dívidas e empréstimos entre pessoas
- Assinaturas mensais ou anuais, com lembrete de vencimento
- Investimentos e cofrinhos com histórico de depósitos
- Importação de extrato CSV ou OFX (conta ou fatura)
- Bot do Telegram para saldo, dívidas e lançamentos rápidos
- Consultor financeiro (app + Telegram): vencimentos, faturas e perguntas específicas (com IA opcional)
- Tema claro e escuro, PWA instalável
- Modo prévia (`?preview=1`) com dados de demonstração

## Stack

- Node.js + Express
- PostgreSQL (Neon)
- HTML, CSS e JavaScript (`frontend/`)

## Backup e recuperação (Neon)

Os dados ficam no PostgreSQL hospedado no [Neon](https://neon.tech). O app não grava dump local: o backup é o da própria plataforma.

1. No painel do Neon, abra o projeto e confira **Backups** / **Point-in-time restore** (disponível nos planos com histórico).
2. Para um snapshot manual, use o console SQL ou a CLI do Neon e exporte quando precisar (`pg_dump` com a `DATABASE_URL` de leitura).
3. Em caso de falha, restaure pelo painel (PITR ou branch a partir de um ponto no tempo) e aponte de novo a `DATABASE_URL` no Render, se a connection string mudar.
4. Guarde a `DATABASE_URL` e o `JWT_SECRET` só no Render / `.env` local — nunca no git.

Em produção o servidor força HTTPS (quando há `RENDER_EXTERNAL_URL` ou `NODE_ENV=production`) e envia HSTS.

## Como rodar

```bash
cp .env.example .env
# preenche DATABASE_URL e JWT_SECRET
npm install
npm start
```

No Render, configure as mesmas variáveis no painel do serviço. O arquivo `.env` não entra no git.

O `npm install` liga um hook de commit que atualiza sozinho o `?v=` dos arquivos do `frontend/` (um hash do conteúdo) e o nome do cache do service worker. Para rodar na mão: `npm run assets`. Para testar a conexão com o banco: `npm run test-db`.

Para o "esqueci a senha" enviar e-mail de verdade, defina também `APP_URL` (endereço público do app), `MAIL_FROM` e a chave de um provedor: `BREVO_API_KEY` ([Brevo](https://brevo.com), aceita um Gmail verificado como remetente) ou `RESEND_API_KEY` ([Resend](https://resend.com), precisa de domínio próprio). Sem a chave, o link de redefinição aparece só no log do servidor.

Com o provedor de e-mail configurado, quem cria conta recebe um link de confirmação (vale 24 horas) e só consegue entrar depois de clicar. Na tela de login dá para pedir o link de novo. Contas que já existiam antes dessa mudança ficam confirmadas. Contas que passam de 7 dias sem confirmar são apagadas sozinhas. Trocar o e-mail no perfil também manda um link para o endereço novo, e a troca só vale depois do clique; o endereço antigo recebe um aviso. Sem `BREVO_API_KEY` nem `RESEND_API_KEY`, nada disso é exigido: o cadastro e a troca de e-mail entram direto.

Quando alguém entra de um aparelho que a conta nunca usou, o dono recebe um aviso por e-mail (e no Telegram, se tiver vinculado) com navegador, sistema, horário e IP, mais um botão para trocar a senha. O primeiro aparelho registrado de cada conta não gera aviso.

## Login com Google

No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um "ID do cliente OAuth" do tipo "Aplicativo da Web" e cadastre `https://bg-finance.onrender.com/auth/google/callback` como URI de redirecionamento autorizado. Coloque o ID e a chave em `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Render. Sem os dois, o botão "Entrar com Google" não aparece.

Se já existir uma conta com o mesmo e-mail, o Google é ligado a ela. Se não existir, a conta é criada já confirmada e sem senha conhecida; para usar e-mail e senha também, a pessoa usa "Esqueceu a senha?".

## Telegram

Crie um bot no [@BotFather](https://t.me/BotFather) e coloque o token em `TELEGRAM_BOT_TOKEN`. O `APP_URL` precisa ser o endereço https do app (no Render, `https://bg-finance.onrender.com`). Na subida, o servidor registra o webhook sozinho.

No app, em Ajustes, a pessoa gera um código e envia `/vincular CODIGO` para o bot. Depois disso valem `/saldo`, `/dividas`, `/proximo`, `/vence`, `/faturas`, `/dicas`, `/gasto 49,90 mercado` e `/receita 1500 salario`. Também dá para perguntar em português (ex.: “quanto eu pago no próximo mês?” ou “consigo guardar 500 este mês?”). O mesmo consultor existe no app, em Mais → Consultor.

Para respostas mais específicas com IA **grátis**, crie uma chave em [console.groq.com](https://console.groq.com) (sem cartão) e coloque `GROQ_API_KEY` no Render. O padrão é o modelo `openai/gpt-oss-120b`. Alternativas: `OPENAI_API_KEY` ou `AI_GATEWAY_API_KEY`. Sem chave, o consultor segue só com regras e dicas básicas.

Para receber um aviso privado a cada login, mande `/id` para o bot e coloque o número em `ADMIN_TELEGRAM_CHAT_ID` no Render. Só esse chat recebe nome, e-mail e horário. O mesmo chat é avisado quando uma conta leva 5 senhas erradas em 15 minutos. Sem a variável, o login segue normal e ninguém é avisado.
