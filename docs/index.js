// @ts-check

/**
 * Sets data-bs-theme before the page paints, so it never flashes the
 * wrong theme
 * priority:
 * 1. ?theme= in the URL
 * 2. system preference
 * 3. light
 * this is why index.js loads synchronously rather than deferred, and why
 * this call sits at the top of the file rather than in the
 * DOMContentLoaded block below: it has to run before <body> renders
 * @returns {"light" | "dark"}
 */
function applyInitialTheme() {
  const param = new URLSearchParams(location.search).get("theme");
  const theme = param === "dark" || param === "light"
    ? param
    : matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  document.documentElement.setAttribute("data-bs-theme", theme);
  return theme;
}

applyInitialTheme();

/** @returns {"light" | "dark"} */
function getTheme() {
  return document.documentElement.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
}

/**
 * @param {"light" | "dark"} theme
 * @param {HTMLElement} toggle
 */
function setTheme(theme, toggle) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  toggle.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
}

/**
 * theme toggle button up
 * flipping it mirrors the choice into ?theme=
 * so the current view is a shareable, reload-stable link
 * @param {HTMLElement} toggle
 */
function initThemeToggle(toggle) {
  setTheme(getTheme(), toggle);
  toggle.addEventListener("click", () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    setTheme(next, toggle);
    const url = new URL(location.href);
    url.searchParams.set("theme", next);
    history.replaceState(null, "", url);
  });
}

// index.js loads synchronously (see applyInitialTheme above), so the toggle
// button doesn't exist yet at this point in the file
// wait for DOMContentLoaded rather than relying on script placement/defer
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    initThemeToggle(themeToggle);
  }
});
