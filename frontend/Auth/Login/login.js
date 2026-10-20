/* ============================================================
   EASYDEAL — LOGIN PAGE
   Purpose: Wire the login form to the centralized auth service.

   All network access goes through ../Services/authService.js. This
   file never calls fetch(), never builds a URL and never touches
   browser storage.

   Scope note: this is the functional foundation. The Figma
   split-panel visual design lands in the later visual stage.
   ============================================================ */

import { login, getCurrentUser } from '../Services/authService.js';
import {
  initTheme,
  mountThemeToggle,
  initPasswordToggle,
  showFieldError,
  clearFieldError,
  setSubmitting,
} from '../Shared/utils.js';
import { redirectAfterAuth } from '../Shared/redirect.js';
import { iconAlertTriangle } from '../../shared/components/icons/icons.js';

const form = document.getElementById('loginForm');
const identifierInput = document.getElementById('emailOrUsername');
const passwordInput = document.getElementById('password');
const rememberMeInput = document.getElementById('rememberMe');
const toggleButton = document.getElementById('togglePassword');
const submitButton = document.getElementById('loginSubmit');
const alertBox = document.getElementById('loginAlert');
const alertMessage = document.getElementById('loginAlertMessage');
const alertIcon = document.getElementById('loginAlertIcon');

initTheme();
mountThemeToggle(document.querySelector('[data-theme-toggle]'));
initPasswordToggle({ toggleButton, passwordInput });

/* ── Feedback ───────────────────────────────────────────────── */

function showAlert(message) {
  alertMessage.textContent = message;
  alertIcon.innerHTML = iconAlertTriangle({ size: 16 });
  alertBox.hidden = false;
}

function hideAlert() {
  alertBox.hidden = true;
  alertMessage.textContent = '';
}

function clearErrors() {
  clearFieldError(identifierInput);
  clearFieldError(passwordInput);
  hideAlert();
}

/* ── Validation ─────────────────────────────────────────────── */

function validate() {
  let firstInvalid = null;

  if (!identifierInput.value.trim()) {
    showFieldError(identifierInput, 'Email or username is required');
    firstInvalid = firstInvalid ?? identifierInput;
  }

  if (!passwordInput.value) {
    showFieldError(passwordInput, 'Password is required');
    firstInvalid = firstInvalid ?? passwordInput;
  }

  return firstInvalid;
}

/* ── Submit ─────────────────────────────────────────────────── */

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();

  const firstInvalid = validate();
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const restore = setSubmitting(submitButton, 'Signing in…', 'Log in');

  const result = await login({
    emailOrUsername: identifierInput.value.trim(),
    password: passwordInput.value,
    // The backend issues the session cookie: unchecked is 1 day, checked
    // is 30 days. Nothing is persisted in the browser either way.
    rememberMe: rememberMeInput.checked,
  });

  if (!result.success) {
    // The backend answers a bad email or password identically so it
    // cannot be attributed to one field: shown at form level, matching
    // the approved error state.
    showAlert(result.message);
    restore();
    passwordInput.focus();
    return;
  }

  // Left disabled on purpose: the page is navigating away.
  redirectAfterAuth(result.user?.role);
});

/* ── Already signed in ──────────────────────────────────────── */

// An authenticated visitor has no business on this page. /user/me reads the
// HttpOnly cookie, so the decision comes from the backend rather than from
// anything the browser is holding.
(async () => {
  const { user } = await getCurrentUser();

  if (user) {
    redirectAfterAuth(user.role);
  }
})();