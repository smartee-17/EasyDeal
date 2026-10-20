/* ============================================================
   EASYDEAL - SHARED THEME
   Single source of truth for the light/dark theme.

   The Admin app, the Auth pages and the shared navbar each had their own
   copy of this logic, which let them drift: the Auth pages had no way to
   change the theme at all, and the stored preference was read by one
   component but written by another. All of them now use this module.

   Contract:
     - `data-theme` on <html> selects the theme.
     - The stored preference wins; the OS preference is only the fallback.
     - A change is broadcast on window so every toggle on the page stays
       in sync, including toggles added later.

   Usage:
     import { initTheme, mountThemeToggle } from '../shared/services/theme.js';
     initTheme();
     mountThemeToggle(document.querySelector('[data-theme-toggle]'));
   ============================================================ */

import { iconMoon, iconSun } from '../components/icons/icons.js';

const STORAGE_KEY = 'easydeal-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
const EVENT = 'easydeal:themechange';

let mediaQuery = null;
let initialised = false;

/* Reads the stored preference, tolerating blocked storage. */
function readStored() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === THEME_DARK || value === THEME_LIGHT ? value : null;
  } catch {
    return null;
  }
}

function writeStored(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // A blocked storage partition must not break the toggle.
  }
}

function prefersDark() {
  return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

/**
 * Apply a theme to the document and broadcast the change.
 * @param {'light'|'dark'} theme
 */
export function applyTheme(theme) {
  const next = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  document.documentElement.setAttribute('data-theme', next);

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = next === THEME_DARK ? '#1a1a1c' : '#ffffff';

  // Every mounted toggle repaints itself, so navbar and Auth toggles agree.
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { theme: next } }));
  return next;
}

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') === THEME_DARK
    ? THEME_DARK
    : THEME_LIGHT;
}

/** Switch to the other theme and remember the choice. */
export function toggleTheme() {
  const next = getCurrentTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  writeStored(next);
  return applyTheme(next);
}

/**
 * Resolve and apply the initial theme, and follow the OS preference for as
 * long as the visitor has not chosen one explicitly.
 */
export function initTheme() {
  if (initialised) return getCurrentTheme();
  initialised = true;

  applyTheme(readStored() ?? (prefersDark() ? THEME_DARK : THEME_LIGHT));

  mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  mediaQuery?.addEventListener?.('change', (event) => {
    // An explicit choice outranks the OS, so only follow the OS until then.
    if (!readStored()) applyTheme(event.matches ? THEME_DARK : THEME_LIGHT);
  });

  return getCurrentTheme();
}

/**
 * Wire a button as a theme toggle.
 *
 * Sets the accessible name to the action it performs ("Switch to dark
 * theme"), swaps the icon to match, and keeps it correct when the theme
 * changes from anywhere on the page.
 *
 * @param {HTMLElement|null} button
 * @returns {HTMLElement|null} the button
 */
export function mountThemeToggle(button) {
  if (!button) return null;

  const paint = () => {
    const dark = getCurrentTheme() === THEME_DARK;
    const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(dark));
    button.dataset.theme = dark ? THEME_DARK : THEME_LIGHT;
    // The glyph shows the theme the button switches to.
    button.innerHTML = dark ? iconSun({ size: 18 }) : iconMoon({ size: 18 });
  };

  button.type = 'button';
  button.classList.add('theme-toggle');
  button.dataset.themeToggle = 'true';
  paint();

  if (!button.dataset.themeToggleBound) {
    button.dataset.themeToggleBound = 'true';
    button.addEventListener('click', () => {
      toggleTheme();
    });
    window.addEventListener(EVENT, paint);
  }

  return button;
}

/** Wire every theme toggle inside a root. */
export function mountThemeToggles(root = document) {
  return root.querySelectorAll('[data-theme-toggle]').forEach(mountThemeToggle);
}