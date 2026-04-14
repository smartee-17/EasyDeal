// DOM Elements
const $logo = document.querySelector('.logo');

// Check system preference
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Initialize the theme mode based on system preference
document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');

// Callback function to update the logo when theme changes
const updateLogo = (mutationList) => {
  for (const mutation of mutationList) {
    const theme = document.documentElement.getAttribute('data-theme');
    $logo.src = (theme === 'dark') ? '../assets/images/logos/logo-dark-rect.png' : '../assets/images/logos/logo-light-rect.png';
  }
};
const observer = new MutationObserver(updateLogo);
observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
});

