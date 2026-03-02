const form = document.getElementById('register-form');
const msg = document.getElementById('msg');

function setMsg(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? '#86efac' : '#fca5a5';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;

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

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error || 'Erro ao cadastrar.');
      return;
    }

    setMsg('Conta criada! Redirecionando para o login...', true);
    setTimeout(() => (window.location.href = 'login.html'), 900);
  } catch (err) {
    setMsg('Falha de conexão com o servidor.');
  }
});