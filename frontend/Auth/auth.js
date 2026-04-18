import { loginUser } from "./authService.js"; 
import { eyeIcon, eyeSlashIcon } from "./icons.js";

/* Handle dark mode based on system preference */
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');

/* Password visibility toggle */
const togglePasswordBtn = document.querySelector('.login__form__toggle-password');
const passwordInput = document.querySelector('.login__form__password-input');
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

/* Login form submission */
const loginForm = document.querySelector('.login__form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // If the form is already submitting, do nothing
	if (loginForm.hasAttribute('data-submitting')) return;

  loginForm.setAttribute('data-submitting', 'true');

  const formData = new FormData(loginForm);
  const credentials = Object.fromEntries(formData);


  try {
    const data = await loginUser(credentials);
    
    // Success: Store the JWT and redirect
    localStorage.setItem('token', data.token);

	  loginForm.removeAttribute('data-submitting');

    // TODO: Implement proper redirection logic based on user role and redirect to the appropriate dashboard
    window.location.href = '/frontend/index.html';
  } catch (err) {
    // UI Error Handling
    document.querySelector('.login__error-msg').textContent = err.message;
  }
});



