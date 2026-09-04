const form = document.getElementById('register-form');
const msg = document.getElementById('msg');

function setMsg(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? '#86efac' : '#fca5a5';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;

  // =========================
  // VALIDAÇÕES
  // =========================

  if (!name) {
    setMsg('Digite seu nome.');
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    setMsg('Digite um email válido.');
    return;
  }

  if (password.length < 6) {
    setMsg('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  if (password !== confirm) {
    setMsg('As senhas não coincidem.');
    return;
  }

  // =========================
  // REQUEST
  // =========================

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error || 'Erro ao cadastrar.');
      return;
    }

    setMsg('Conta criada com sucesso! Redirecionando...', true);

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 900);

  } catch (err) {
    setMsg('Falha de conexão com o servidor.');
  }
});