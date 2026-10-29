(function (root) {
  const MIN_LENGTH = 10;
  const MAX_BYTES = 72;
  const SEQUENCES = [
    "abcdefghijklmnopqrstuvwxyz",
    "01234567890",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];
  const COMMON = [
    "senha", "password", "passw", "qwerty", "admin", "brasil", "flamengo", "corinthians",
    "palmeiras", "santos", "saopaulo", "gremio", "vasco", "cruzeiro", "botafogo", "fluminense",
    "internacional", "iloveyou", "teamo", "amor", "deus", "jesus", "mudar", "trocar", "bgfinance",
    "finance", "financa", "dinheiro", "teste", "test", "welcome", "bemvindo", "letmein", "monkey",
    "dragon", "master", "princesa", "futebol", "familia", "segredo", "acesso", "login", "usuario",
  ];
  const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "!": "i" };

  function plain(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  function hasSequence(text, size) {
    for (const base of SEQUENCES) {
      for (const line of [base, [...base].reverse().join("")]) {
        for (let i = 0; i + size <= line.length; i++) {
          if (text.includes(line.slice(i, i + size))) return true;
        }
      }
    }
    return false;
  }

  // A common word is only rejected when what is left around it is too weak to carry the password.
  function leansOnCommonWord(lower) {
    const leet = [...lower].map((ch) => LEET[ch] || ch).join("");
    return COMMON.some((word) => {
      const at = leet.indexOf(word);
      if (at < 0) return false;
      const rest = lower.slice(0, at) + lower.slice(at + word.length);
      return rest.length < 6 || !/[a-z]/.test(rest);
    });
  }

  function personalBits(context) {
    const local = plain(context.email).split("@")[0];
    const parts = [local, ...local.split(/[^a-z0-9]+/), ...plain(context.name).split(/\s+/)];
    return parts.filter((part) => part.length >= 4);
  }

  function passwordProblem(password, context = {}) {
    const raw = String(password || "");
    const lower = plain(raw);

    if (raw.length < MIN_LENGTH) return `A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`;
    if (new TextEncoder().encode(raw).length > MAX_BYTES) return "A senha pode ter no máximo 72 caracteres.";
    if (/^\d+$/.test(raw)) return "Não use só números. Misture letras também.";
    if (/(.)\1{3,}/.test(lower) || new Set(lower).size < 5) return "Use caracteres mais variados, sem repetir o mesmo várias vezes.";
    if (hasSequence(lower, 4)) return "Evite sequências como 1234, abcd ou qwerty.";
    if (leansOnCommonWord(lower)) return "Essa senha é muito fácil de adivinhar. Tente algo menos comum.";
    if (personalBits(context).some((bit) => lower.includes(bit))) return "Não use seu nome ou seu e-mail na senha.";
    return "";
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { passwordProblem, MIN_LENGTH };
  } else {
    root.passwordProblem = passwordProblem;
  }
})(typeof window !== "undefined" ? window : globalThis);
