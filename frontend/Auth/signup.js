import { registerUser } from "./authService.js";

/* Signup form submission */
const signupForm = document.querySelector('.form');
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // If the form is already submitting, do nothing
  if (signupForm.hasAttribute('data-submitting')) return;

  signupForm.setAttribute('data-submitting', 'true');

  // Clear any previous error messages
  document.querySelector('.form__error-msg').textContent = '';

  const formData = new FormData(signupForm);
  const credentials = Object.fromEntries(formData);

  try {
    const data = await registerUser(credentials);

    localStorage.setItem('user', JSON.stringify(data.user));

    signupForm.removeAttribute('data-submitting');

    if (data.user.role === 'admin') {
      window.location.href = '../Admin/admin.html';
    } else {
      window.location.href = '..';
    }
  } catch (err) {
    // UI Error Handling
    document.querySelector('.form__error-msg').textContent = err.message;
    signupForm.removeAttribute('data-submitting');
  }
});



