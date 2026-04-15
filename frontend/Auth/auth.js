import { loginUser } from "./authService.js"; 

/* Handle dark mode based on system preference */
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');

/* Login form submission */
const loginForm = document.querySelector('.login__form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const credentials = Object.fromEntries(formData);


  try {
    const data = await loginUser(credentials);
    
    // Success: Store the JWT and redirect
    localStorage.setItem('token', data.token);

    // TODO: Implement proper redirection logic based on user role and redirect to the appropriate dashboard
    window.location.href = '/frontend/index.html';
  } catch (err) {
    // UI Error Handling
    document.querySelector('.login__error-msg').textContent = err.message;
  }
});



