const form = document.getElementById("reset-form");
const msg = document.getElementById("msg");
const submitBtn = document.getElementById("submit-btn");
const token = new URLSearchParams(location.search).get("token") || "";

history.replaceState(null, "", location.pathname);

function showInvalid() {
  document.getElementById("step-form").classList.add("hidden");
  document.getElementById("step-invalid").classList.remove("hidden");
}

if (!token) showInvalid();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  if (password.length < 6) return setMsg(msg, "A senha deve ter pelo menos 6 caracteres.");
  if (password !== confirm) return setMsg(msg, "As senhas não coincidem.");

  setMsg(msg, "");
  setLoading(submitBtn, true, "Salvando…");
  try {
    await postJSON("/auth/reset", { token, password });
    localStorage.removeItem("token");
    window.location.href = "login.html?reset=1";
  } catch (err) {
    if (err.status === 400 && /expirado/i.test(err.message)) return showInvalid();
    setMsg(msg, err.message);
    setLoading(submitBtn, false);
  }
});
