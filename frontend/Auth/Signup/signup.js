/* ============================================================
   EASYDEAL — SIGNUP PAGE
   Purpose: Wire the registration form to the centralized auth service.

   All network access goes through ../Services/authService.js. This
   file never calls fetch(), never builds a URL and never touches
   browser storage.

   Contract notes (Stage 1)
   - No username is collected or sent: the backend generates one.
   - Account type maps to the backend role: Buyer -> 'user',
     Seller -> 'seller'.
   - Password minimum is 8 characters, enforced here and again by the
     backend, which is the authority.

   Scope note: the Figma split-panel visual design lands in a later
   visual stage.
   ============================================================ */

import { register, getCurrentUser, ACCOUNT_TYPES } from '../Services/authService.js';
import {
  initTheme,
  mountThemeToggle,
  initPasswordToggle,
  showFieldError,
  clearFieldError,
  setSubmitting,
  PASSWORD_MIN_LENGTH,
} from '../Shared/utils.js';
import { redirectAfterAuth, destinationAfterSignup } from '../Shared/redirect.js';
import { iconAlertTriangle } from '../../shared/components/icons/icons.js';

const form = document.getElementById('signupForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const toggleButton = document.getElementById('togglePassword');
const submitButton = document.getElementById('signupSubmit');
const alertBox = document.getElementById('signupAlert');
const alertMessage = document.getElementById('signupAlertMessage');
const alertIcon = document.getElementById('signupAlertIcon');

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
  for (const input of [nameInput, emailInput, phoneInput, passwordInput]) {
    clearFieldError(input);
  }
  hideAlert();
}

/* ── Validation ─────────────────────────────────────────────── */

/**
 * Deliberately permissive checks. Anything stricter than shape
 * (name character sets, phone formats) is left to the backend, which
 * owns the real rules, so the two cannot disagree.
 *
 * @returns {HTMLElement|null} the first field to focus, or null when valid
 */
function validate() {
  let firstInvalid = null;

  const fail = (input, message) => {
    showFieldError(input, message);
    firstInvalid = firstInvalid ?? input;
  };

  if (!nameInput.value.trim()) {
    fail(nameInput, 'Full name is required');
  }

  const email = emailInput.value.trim();
  if (!email) {
    fail(emailInput, 'Email address is required');
  } else if (!emailInput.checkValidity()) {
    // type="email" owns the pattern; required/format stay with the browser.
    fail(emailInput, 'Please enter a valid email address');
  }

  if (!phoneInput.value.trim()) {
    fail(phoneInput, 'Phone number is required');
  }

  const password = passwordInput.value;
  if (!password) {
    fail(passwordInput, 'Password is required');
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    fail(
      passwordInput,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    );
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

  const chosenType =
    form.querySelector('input[name="accountType"]:checked')?.value ??
    ACCOUNT_TYPES.BUYER;

  const restore = setSubmitting(submitButton, 'Creating account…', 'Create account');

  const result = await register({
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    password: passwordInput.value,
    role: chosenType,
    // Registration issues the session cookie. The approved behaviour is
    // a 1-day session unless Remember Me is added to this form later.
    rememberMe: false,
  });

  if (!result.success) {
    // Field-specific duplicates are reported inline; anything that cannot
    // be attributed to one field is shown here instead.
    showAlert(result.message);
    restore();
    return;
  }

  // Both Buyer and Seller return to the Homepage after signup. No
  // seller dashboard is invented at this stage.
  window.location.href = destinationAfterSignup();
});

/* ── Already signed in ──────────────────────────────────────── */

// An existing account has no business registering a second one.
(async () => {
  const { user } = await getCurrentUser();

  if (user) {
    redirectAfterAuth(user.role);
  }
})();