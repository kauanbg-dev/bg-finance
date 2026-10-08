(function () {
  const root = document.documentElement;
  const sun = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const moon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg>';

  function apply(theme) {
    root.dataset.theme = theme;
    localStorage.setItem("bg-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f3f6fb" : "#0f172a");
    document.dispatchEvent(new CustomEvent("bg-theme", { detail: theme }));
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  const actions = document.querySelector(".top-actions");
  if (actions) actions.insertBefore(button, actions.firstChild);
  else document.body.appendChild(button);

  function paint() {
    const light = root.dataset.theme === "light";
    button.innerHTML = light ? moon : sun;
    button.setAttribute("aria-label", light ? "Usar modo escuro" : "Usar modo claro");
  }

  button.addEventListener("click", () => {
    apply(root.dataset.theme === "light" ? "dark" : "light");
    paint();
  });
  paint();
})();
