const form = document.getElementById("login-form");
const msg = document.getElementById("msg");
const submitBtn = document.getElementById("submit-btn");
const emailInput = document.getElementById("email");
const params = new URLSearchParams(location.search);

if (localStorage.getItem("token")) window.location.href = "index.html";
if (params.get("email")) emailInput.value = params.get("email");
if (params.get("reset") === "1") setMsg(msg, "Senha alterada! Entre com a nova senha.", "success");
if (params.get("registered") === "1") setMsg(msg, "Conta criada! Agora é só entrar.", "success");

document.getElementById("forgot-link").addEventListener("click", (e) => {
  const email = emailInput.value.trim();
  if (email) e.currentTarget.href = `./forgot.html?email=${encodeURIComponent(email)}`;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (!email || !password) return setMsg(msg, "Preencha e-mail e senha.");

  setMsg(msg, "");
  setLoading(submitBtn, true, "Entrando…");
  try {
    const data = await postJSON("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    window.location.href = "index.html";
  } catch (err) {
    setMsg(msg, err.status === 401 ? "E-mail ou senha incorretos." : err.message);
    setLoading(submitBtn, false);
  }
});
