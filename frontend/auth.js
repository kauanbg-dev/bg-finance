const AUTH_ICON = {
  eye: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.9 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M2 2l20 20"/></svg>',
};

function setMsg(el, text, kind = "error") {
  el.textContent = text;
  el.className = text ? `msg msg-${kind}` : "msg";
}

function setLoading(btn, loading, label) {
  if (!btn.dataset.label) btn.dataset.label = btn.textContent;
  btn.disabled = loading;
  btn.classList.toggle("is-loading", loading);
  btn.textContent = loading ? label : btn.dataset.label;
}

async function postJSON(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Sem conexão com o servidor. Tente de novo em instantes.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || "Algo deu errado. Tente de novo.");
    error.status = res.status;
    throw error;
  }
  return data;
}

function passwordScore(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return pw ? Math.max(score, 1) : 0;
}

document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
  const input = document.getElementById(btn.dataset.togglePassword);
  const paint = () => {
    const visible = input.type === "text";
    btn.innerHTML = visible ? AUTH_ICON.eyeOff : AUTH_ICON.eye;
    btn.setAttribute("aria-label", visible ? "Ocultar senha" : "Mostrar senha");
  };
  btn.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
    paint();
    input.focus();
  });
  paint();
});

document.querySelectorAll("[data-strength]").forEach((input) => {
  const meter = document.getElementById(input.dataset.strength);
  const labels = ["", "Fraca", "Razoável", "Boa", "Forte"];
  input.addEventListener("input", () => {
    const score = passwordScore(input.value);
    meter.dataset.score = String(score);
    meter.querySelector(".strength-label").textContent = labels[score];
  });
});
