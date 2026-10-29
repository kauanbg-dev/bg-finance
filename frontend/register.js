const form = document.getElementById("register-form");
const msg = document.getElementById("msg");
const submitBtn = document.getElementById("submit-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  if (!name) return setMsg(msg, "Digite seu nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg(msg, "Digite um e-mail válido.");
  const problem = passwordProblem(password, { name, email });
  if (problem) return setMsg(msg, problem);
  if (password !== confirm) return setMsg(msg, "As senhas não coincidem.");

  setMsg(msg, "");
  setLoading(submitBtn, true, "Criando conta…");
  try {
    const data = await postJSON("/auth/register", { name, email, password });
    const verify = data.verify ? "&verify=1" : "";
    window.location.href = `login.html?registered=1${verify}&email=${encodeURIComponent(email)}`;
  } catch (err) {
    setMsg(msg, err.message === "Email ja cadastrado" ? "Esse e-mail já tem conta. Que tal entrar?" : err.message);
    setLoading(submitBtn, false);
  }
});
