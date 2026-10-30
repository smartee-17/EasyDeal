const loadComponent = async (selector, path) => {
  const element = document.querySelector(selector);

  if (!element) return;

  try {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Failed to load component: ${response.status}`);
    }

    element.innerHTML = await response.text();
  } catch (error) {
    console.error(`Error loading component from ${path}:`, error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadComponent(
    "[data-component='header']",
    "../shared/components/header/header.html"
  );

  loadComponent(
    "[data-component='footer']",
    "../shared/components/footer/footer.html"
  );
});