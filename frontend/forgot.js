const form = document.getElementById("forgot-form");
const msg = document.getElementById("msg");
const submitBtn = document.getElementById("submit-btn");
const emailInput = document.getElementById("email");
const resendBtn = document.getElementById("resend-btn");
const resendMsg = document.getElementById("resend-msg");

const preset = new URLSearchParams(location.search).get("email");
if (preset) emailInput.value = preset;

let lastEmail = "";

async function requestLink(email) {
  await postJSON("/auth/forgot", { email });
  lastEmail = email;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg(msg, "Digite um e-mail válido.");

  setMsg(msg, "");
  setLoading(submitBtn, true, "Enviando…");
  try {
    await requestLink(email);
    document.getElementById("sent-email").textContent = email;
    document.getElementById("step-form").classList.add("hidden");
    document.getElementById("step-sent").classList.remove("hidden");
  } catch (err) {
    setMsg(msg, err.message);
  } finally {
    setLoading(submitBtn, false);
  }
});

resendBtn.addEventListener("click", async () => {
  setLoading(resendBtn, true, "Enviando…");
  try {
    await requestLink(lastEmail);
    setMsg(resendMsg, "Pronto, enviamos outro link.", "success");
    let wait = 30;
    resendBtn.disabled = true;
    const timer = setInterval(() => {
      wait -= 1;
      resendBtn.textContent = wait > 0 ? `Enviar de novo (${wait}s)` : resendBtn.dataset.label;
      if (wait <= 0) {
        clearInterval(timer);
        resendBtn.disabled = false;
      }
    }, 1000);
    resendBtn.classList.remove("is-loading");
    resendBtn.textContent = `Enviar de novo (${wait}s)`;
  } catch (err) {
    setMsg(resendMsg, err.message);
    setLoading(resendBtn, false);
  }
});
