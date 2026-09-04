const form = document.getElementById('login-form');
const msg = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || 'Erro ao entrar.';
      return;
    }

    localStorage.setItem('token', data.token);
    window.location.href = 'index.html';
  } catch (err) {
    msg.textContent = 'Falha de conexão com o servidor. Veja se o node server.js está rodando.';
  }
});