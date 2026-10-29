const params = new URLSearchParams(location.search);
const email = params.get("email") || "";
const isChange = params.get("kind") === "change";

if (isChange) {
  document.getElementById("ok-title").textContent = "E-mail alterado!";
  document.getElementById("ok-text").classList.add("hidden");
  document.getElementById("ok-change-text").classList.remove("hidden");
  document.getElementById("ok-change-email").textContent = email;
  document.getElementById("invalid-text").classList.add("hidden");
  document.getElementById("invalid-change-text").classList.remove("hidden");
  document.getElementById("resend-form").classList.add("hidden");
}

if (params.get("status") === "ok") {
  if (email) {
    document.getElementById("ok-email").textContent = email;
    document.getElementById("ok-email-wrap").classList.remove("hidden");
    document.getElementById("login-btn").href = `./login.html?email=${encodeURIComponent(email)}`;
  }
  document.getElementById("step-ok").classList.remove("hidden");
} else {
  document.getElementById("step-invalid").classList.remove("hidden");
}

const form = document.getElementById("resend-form");
const msg = document.getElementById("msg");
const submitBtn = document.getElementById("submit-btn");
const emailInput = document.getElementById("email");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const value = emailInput.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setMsg(msg, "Digite um e-mail válido.");

  setMsg(msg, "");
  setLoading(submitBtn, true, "Enviando…");
  try {
    await postJSON("/auth/verify/resend", { email: value });
    setMsg(msg, "Se essa conta ainda não foi confirmada, enviamos um novo link. Confira também o spam.", "success");
  } catch (err) {
    setMsg(msg, err.message);
  } finally {
    setLoading(submitBtn, false);
  }
});
