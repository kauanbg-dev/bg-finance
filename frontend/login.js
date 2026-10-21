const form = document.getElementById("login-form");
const msg = document.getElementById("msg");
const submitBtn = document.getElementById("submit-btn");
const emailInput = document.getElementById("email");
const params = new URLSearchParams(location.search);

if ("caches" in window) {
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("bg-finance")).map((key) => caches.delete(key)))).catch(() => {});
}

fetch("/me", { credentials: "include", cache: "no-store" })
  .then((res) => {
    const json = String(res.headers.get("content-type") || "").includes("application/json");
    if (res.ok && json) window.location.replace("index.html");
  })
  .catch(() => {});
if (params.get("email")) emailInput.value = params.get("email");
if (params.get("reset") === "1") setMsg(msg, "Senha alterada! Entre com a nova senha.", "success");
if (params.get("registered") === "1") setMsg(msg, "Conta criada! Agora é só entrar.", "success");

document.getElementById("forgot-link").addEventListener("click", (e) => {
  const email = emailInput.value.trim();
  if (email) e.currentTarget.href = `./forgot.html?email=${encodeURIComponent(email)}`;
});

let signingIn = false;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (signingIn) return;
  const email = emailInput.value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (!email || !password) return setMsg(msg, "Preencha e-mail e senha.");

  signingIn = true;
  setMsg(msg, "");
  setLoading(submitBtn, true, "Entrando…");
  try {
    await postJSON("/auth/login", { email, password });
    localStorage.removeItem("token");
    document.documentElement.classList.add("booting");
    window.location.replace("index.html");
  } catch (err) {
    signingIn = false;
    const raw = String(err.message || "");
    const cold = err.status >= 500 || /conexão|servidor|completar a ação/i.test(raw);
    setMsg(
      msg,
      err.status === 401
        ? "E-mail ou senha incorretos."
        : cold
          ? "O servidor ainda está ligando. Toque em Entrar de novo."
          : raw
    );
    setLoading(submitBtn, false);
  }
});
