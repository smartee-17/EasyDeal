import { eyeIcon, eyeSlashIcon } from "./icons.js";

/* Handle dark mode based on system preference */
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');

/* Password visibility toggle */
const togglePasswordBtn = document.querySelector('.form__toggle-password');
const passwordInput = document.querySelector('.form__password-input');
togglePasswordBtn.addEventListener('click', () => {
  const isPasswordVisible = passwordInput.type === 'text';
  if (isPasswordVisible) {
    passwordInput.type = 'password';
    togglePasswordBtn.setAttribute('aria-label', 'Show password as plain text. Warning: this will display your password on the screen.');
    togglePasswordBtn.innerHTML = eyeIcon;
  } else {
    passwordInput.type = 'text';
    togglePasswordBtn.setAttribute('aria-label', 'Hide password');
    togglePasswordBtn.innerHTML = eyeSlashIcon;
  }
});