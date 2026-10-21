(function () {
  var theme = localStorage.getItem("bg-theme");
  if (theme !== "light" && theme !== "dark") theme = "dark";
  document.documentElement.setAttribute("data-theme", theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f3f6fb" : "#0f172a");
  var path = location.pathname;
  var onApp = path === "/" || /\/index\.html$/i.test(path);
  var preview = /(?:^|[?&])preview=1(?:&|$)/.test(location.search);
  if (onApp && !preview) document.documentElement.classList.add("booting");
})();
