# BG Finance

Sistema de controle financeiro com login, categorias, gráficos e exportação CSV.

**Ao vivo:** [bg-finance.onrender.com](https://bg-finance.onrender.com/)

## Funcionalidades

- Cadastro e login (JWT), com recuperação de senha por e-mail
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

Para o "esqueci a senha" enviar e-mail de verdade, defina também `APP_URL` (endereço público do app), `MAIL_FROM` e a chave de um provedor: `BREVO_API_KEY` ([Brevo](https://brevo.com), aceita um Gmail verificado como remetente) ou `RESEND_API_KEY` ([Resend](https://resend.com), precisa de domínio próprio). Sem a chave, o link de redefinição aparece só no log do servidor.

Com o provedor de e-mail configurado, quem cria conta recebe um link de confirmação (vale 24 horas) e só consegue entrar depois de clicar. Na tela de login dá para pedir o link de novo. Contas que já existiam antes dessa mudança ficam confirmadas. Contas que passam de 7 dias sem confirmar são apagadas sozinhas. Trocar o e-mail no perfil também manda um link para o endereço novo, e a troca só vale depois do clique; o endereço antigo recebe um aviso. Sem `BREVO_API_KEY` nem `RESEND_API_KEY`, nada disso é exigido: o cadastro e a troca de e-mail entram direto.

Quando alguém entra de um aparelho que a conta nunca usou, o dono recebe um aviso por e-mail (e no Telegram, se tiver vinculado) com navegador, sistema, horário e IP, mais um botão para trocar a senha. O primeiro aparelho registrado de cada conta não gera aviso.

## Login com Google

No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um "ID do cliente OAuth" do tipo "Aplicativo da Web" e cadastre `https://bg-finance.onrender.com/auth/google/callback` como URI de redirecionamento autorizado. Coloque o ID e a chave em `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Render. Sem os dois, o botão "Entrar com Google" não aparece.

Se já existir uma conta com o mesmo e-mail, o Google é ligado a ela. Se não existir, a conta é criada já confirmada e sem senha conhecida; para usar e-mail e senha também, a pessoa usa "Esqueceu a senha?".

## Telegram

Crie um bot no [@BotFather](https://t.me/BotFather) e coloque o token em `TELEGRAM_BOT_TOKEN`. O `APP_URL` precisa ser o endereço https do app (no Render, `https://bg-finance.onrender.com`). Na subida, o servidor registra o webhook sozinho.

No app, em Ajustes, a pessoa gera um código e envia `/vincular CODIGO` para o bot. Depois disso valem `/saldo`, `/dividas`, `/gasto 49,90 mercado` e `/receita 1500 salario`.

Para receber um aviso privado a cada login, mande `/id` para o bot e coloque o número em `ADMIN_TELEGRAM_CHAT_ID` no Render. Só esse chat recebe nome, e-mail e horário. O mesmo chat é avisado quando uma conta leva 5 senhas erradas em 15 minutos. Sem a variável, o login segue normal e ninguém é avisado.

Quem vinculou o Telegram recebe, uma vez por dia a partir das 8h, um lembrete das dívidas e assinaturas que vencem hoje, amanhã ou atrasaram na última semana. `/lembretes off` desliga e `/lembretes on` liga de novo. Como o Render grátis dorme sem uso, o workflow `.github/workflows/telegram-reminders.yml` chama o servidor todo dia às 8h05 de Brasília: defina o mesmo valor em `CRON_SECRET` no Render e no secret `CRON_SECRET` do repositório no GitHub.
