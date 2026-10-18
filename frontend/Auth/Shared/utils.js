/* ============================================================
   EASYDEAL — AUTH SHARED UTILITIES
   Purpose: Presentation helpers shared by every Auth page.
            Deliberately contains no network calls: all of those
            live in ../Services/authService.js.

   Loaded as a module by each page, which then calls the
   initialisers below. Nothing runs at import time, so a page without
   a password field is no longer a crash (the previous version
   dereferenced .form__toggle-password unconditionally).
   ============================================================ */

import {
  iconEye,
  iconEyeOff,
  iconAlertTriangle,
} from '../../shared/components/icons/icons.js';

/** Approved minimum password length. Mirrors the backend. */
export const PASSWORD_MIN_LENGTH = 8;

/* ── Theme ──────────────────────────────────────────────────── */

/**
 * Apply the colour theme.
 *
 * Colours come from the universal shared system
 * (frontend/shared/global.css), which defines tokens under
 * :root and [data-theme="dark"]. Previously this file set
 * data-theme from the OS preference on every page, which fought
 * with the Admin app's theme.js localStorage contract. The stored
 * value is now honoured, and the OS preference is only the initial
 * fallback.
 */
export function initTheme() {
  const STORAGE_KEY = 'easydeal-theme';

  const saved = safeStorageGet(STORAGE_KEY);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  applyTheme(saved ?? (prefersDark ? 'dark' : 'light'));
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private browsing or a blocked storage partition.
    return null;
  }
}

/* ── Password visibility ────────────────────────────────────── */

/**
 * Wire a show/hide control for one password input.
 *
 * Uses the project icon system (frontend/admin/components/icons),
 * not an inline or third-party icon set.
 *
 * @param {object}  options
 * @param {HTMLButtonElement} options.toggleButton
 * @param {HTMLInputElement}  options.passwordInput
 * @returns {() => void} teardown function
 */
export function initPasswordToggle({ toggleButton, passwordInput }) {
  if (!toggleButton || !passwordInput) return () => {};

  const SHOW_LABEL = 'Show password';
  const HIDE_LABEL = 'Hide password';

  const paint = () => {
    const revealed = passwordInput.type === 'text';
    toggleButton.setAttribute('aria-label', revealed ? HIDE_LABEL : SHOW_LABEL);
    // aria-pressed communicates the toggle's current state to assistive tech.
    toggleButton.setAttribute('aria-pressed', String(revealed));
    toggleButton.innerHTML = revealed ? iconEyeOff({ size: 18 }) : iconEye({ size: 18 });
  };

  const onClick = () => {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    paint();
  };

  toggleButton.addEventListener('click', onClick);
  paint();

  return () => toggleButton.removeEventListener('click', onClick);
}

/* ── Field errors ───────────────────────────────────────────── */

/**
 * Attach an inline error message to a field.
 *
 * The message lives in a dedicated element referenced by
 * aria-describedby, and the element points back at the input with
 * aria-invalid, so a screen reader announces the failure on focus
 * rather than leaving it as unassociated red text.
 *
 * @param {HTMLInputElement} input
 * @param {string} message
 * @param {string} errorId
 */
/**
 * Attach an inline error message to a field.
 *
 * The message is rendered beside a warning icon from the project icon
 * system, so an error is never signalled by colour alone. The element
 * is referenced by aria-describedby and the input is marked
 * aria-invalid, so a screen reader announces the failure on focus.
 *
 * @param {HTMLInputElement} input
 * @param {string} message
 * @param {string} [errorId]
 */
export function showFieldError(input, message, errorId) {
  if (!input) return;

  input.classList.add('form-field--error');
  input.setAttribute('aria-invalid', 'true');

  const id = errorId || `${input.id}-error`;
  let errorEl = document.getElementById(id);

  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.id = id;
    errorEl.className = 'form-field__message form-field__error';
    // Errors appear and disappear, so announce them.
    errorEl.setAttribute('role', 'alert');
    input.insertAdjacentElement('afterend', errorEl);
  }

  // Icon is decorative: the message text carries the meaning.
  errorEl.innerHTML =
    '<span class="form-field__message-icon" aria-hidden="true">' +
    iconAlertTriangle({ size: 14 }) +
    '</span><span></span>';
  errorEl.querySelector('span:last-child').textContent = message;

  input.setAttribute('aria-describedby', id);
}

export function clearFieldError(input, errorId) {
  if (!input) return;

  input.classList.remove('form-field--error');
  input.removeAttribute('aria-invalid');

  const id = errorId || `${input.id}-error`;
  const errorEl = document.getElementById(id);

  if (errorEl) {
    errorEl.textContent = '';
    input.removeAttribute('aria-describedby');
  }
}

/* ── Submit state ───────────────────────────────────────────── */

/**
 * Disable a submit button and show a busy message, guarding against
 * double submission.
 *
 * @returns {() => void} restore function
 */
export function setSubmitting(submitButton, busyLabel, idleLabel) {
  if (!submitButton) return () => {};

  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  submitButton.dataset.idleLabel = submitButton.dataset.idleLabel ?? idleLabel;
  if (busyLabel) submitButton.textContent = busyLabel;

  return () => {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitButton.textContent = submitButton.dataset.idleLabel;
  };
}
