import { loginUser } from "../Services/authService.js";

/* Login form submission */
const loginForm = document.querySelector('.form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // If the form is already submitting, do nothing
	if (loginForm.hasAttribute('data-submitting')) return;

  loginForm.setAttribute('data-submitting', 'true');

  // Clear any previous error messages
  document.querySelector('.form__error-msg').textContent = '';

  const formData = new FormData(loginForm);
  const credentials = Object.fromEntries(formData);

  try {
    const data = await loginUser(credentials);
    
    // Success: Store the JWT and redirect
    // TODO: Consider using HttpOnly cookies for better security instead of localStorage, which is vulnerable to XSS attacks. If using cookies, the backend should set the cookie with the token and the frontend can just redirect without handling the token directly.
    // TODO: Store user role and other necessary info in a secure way (e.g., HttpOnly cookies, or if using localStorage, ensure it's encrypted and has proper expiration handling).
    localStorage.setItem('token', data.token);

	  loginForm.removeAttribute('data-submitting');

    if (data.user.role === 'admin') {
      window.location.href = '../../Admin/admin.html';
    } else {
      window.location.href = '../../Homepage/homepage.html';
    }
  } catch (err) {
    // UI Error Handling
    document.querySelector('.form__error-msg').textContent = err.message;
  }
});



