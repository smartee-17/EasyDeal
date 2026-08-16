/* ============================================================
   EASYDEAL — ADMIN LOGIN PAGE JS
   Purpose: Login form handling, auth integration, redirect
   ============================================================ */

import { initTheme } from '../../utils/theme.js';
import { login, redirectToDashboard } from '../../services/authService.js';
import { showToast } from '../../components/toast/toast.js';

initTheme();

const form = document.getElementById('loginForm');
const emailOrUsernameInput = document.getElementById('emailOrUsername');
const passwordInput = document.getElementById('password');
const rememberMeInput = document.getElementById('rememberMe');
const submitBtn = document.getElementById('loginSubmit');
const submitText = submitBtn.querySelector('.login-form__submit-text');
const spinner = document.getElementById('loginSpinner');
const alertBox = document.getElementById('loginAlert');
const alertMessage = document.getElementById('loginAlertMessage');
const togglePasswordBtn = document.getElementById('togglePassword');

togglePasswordBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  togglePasswordBtn.innerHTML = isPassword
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();
  clearFieldErrors();

  const emailOrUsername = emailOrUsernameInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberMeInput.checked;

  let hasError = false;
  if (!emailOrUsername) {
    showFieldError(emailOrUsernameInput, 'Email or username is required');
    hasError = true;
  }
  if (!password) {
    showFieldError(passwordInput, 'Password is required');
    hasError = true;
  }
  if (hasError) return;

  setLoading(true);

  try {
    const result = await login({ emailOrUsername, password, rememberMe });

    if (!result.success) {
      showAlert(result.message || 'Login failed. Please try again.');
      setLoading(false);
      return;
    }

    showToast({
      type: 'success',
      title: 'Welcome back',
      message: 'Login successful. Redirecting in 10 seconds...'
    });

    setTimeout(() => {
      redirectToDashboard();
    }, 10 * 1000);  
  } catch (error) {
    console.error('[Login] unexpected error:', error);
    showAlert('An unexpected error occurred. Please try again.');
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitText.textContent = isLoading ? 'Signing in...' : 'Sign In';
  spinner.classList.toggle('hidden', !isLoading);
}

function showAlert(message) {
  alertMessage.textContent = message;
  alertBox.classList.remove('hidden');
}

function hideAlert() {
  alertBox.classList.add('hidden');
}

function showFieldError(input, message) {
  input.classList.add('form-input--error');
  let errorEl = input.parentElement.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    input.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

function clearFieldErrors() {
  document.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));
  document.querySelectorAll('.form-error').forEach(el => el.remove());
}