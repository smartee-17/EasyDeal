/* ============================================================
   EASYDEAL — THEME SYSTEM
   Purpose: Light/Dark mode toggle without page reload
   ============================================================ */

const STORAGE_KEY = 'easydeal-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = saved || (prefersDark ? THEME_DARK : THEME_LIGHT);

  applyTheme(initialTheme);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.navbar__theme-btn');
    if (!btn) return;
    const current = document.documentElement.getAttribute('data-theme') || THEME_LIGHT;
    const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
    }
  });
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.content = theme === THEME_DARK ? '#1a1a1c' : '#ffffff';
}

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || THEME_LIGHT;
}