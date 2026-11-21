(() => {
  const root = document.documentElement;
  const storageKey = "lernwerkstatt-theme";
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch {}

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".theme-toggle");
    const darkMode = () => root.dataset.theme ? root.dataset.theme === "dark" : systemTheme.matches;
    const english = root.lang === "en";
    function updateLabel() {
      const dark = darkMode();
      toggle.textContent = english ? (dark ? "Light" : "Dark") : (dark ? "Hell" : "Dunkel");
      toggle.setAttribute("aria-label", english
        ? (dark ? "Light: switch to light mode" : "Dark: switch to dark mode")
        : (dark ? "Hell: zu hellem Design wechseln" : "Dunkel: zu dunklem Design wechseln"));
    }
    toggle.addEventListener("click", () => {
      root.dataset.theme = darkMode() ? "light" : "dark";
      try { localStorage.setItem(storageKey, root.dataset.theme); } catch {}
      updateLabel();
    });
    systemTheme.addEventListener("change", updateLabel);
    updateLabel();
    toggle.hidden = false;
  });
})();
