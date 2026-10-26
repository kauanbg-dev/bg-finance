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
  var w = Math.min(window.innerWidth, window.screen && window.screen.width || window.innerWidth);
  var h = Math.min(window.innerHeight, window.screen && window.screen.height || window.innerHeight);
  var watch = w <= 430 && h <= 520;
  document.documentElement.classList.toggle("watch", watch);
  document.documentElement.classList.toggle("watch-round", watch && (Math.abs(w - h) < 48 || (window.matchMedia && window.matchMedia("(shape: round)").matches)));
})();
