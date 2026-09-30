/* ============================================================
   EASYDEAL — NAVBAR COMPONENT
   Purpose: Shared navbar behavior (search, mobile, theme)
   ============================================================ */

import { iconSearch, iconClose, iconMenu, iconSun, iconMoon } from '../icons/icons.js';

export function initNavbar(options = {}) {
  const {
    context = 'public',
    searchPlaceholder = 'Search...',
    onSearch = null,
  } = options;

  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  renderIconButtons(navbar);
  initSearch(navbar, searchPlaceholder, onSearch);
  initMobileSearch(navbar);

  if (context === 'admin') {
    initHamburger(navbar);
  }
}

function renderIconButtons(navbar) {
  const themeBtn = navbar.querySelector('.navbar__theme-btn');
  if (themeBtn) {
    themeBtn.setAttribute('aria-label', 'Toggle theme');
    const sun = themeBtn.querySelector('.icon--sun');
    const moon = themeBtn.querySelector('.icon--moon');
    if (sun && !sun.querySelector('svg')) sun.innerHTML = iconSun({ size: 20 });
    if (moon && !moon.querySelector('svg')) moon.innerHTML = iconMoon({ size: 20 });
  }

  const searchToggle = navbar.querySelector('.navbar__search-toggle');
  if (searchToggle) {
    searchToggle.innerHTML = iconSearch({ size: 20 });
    searchToggle.setAttribute('aria-label', 'Open search');
  }

  const hamburger = navbar.querySelector('.navbar__hamburger');
  if (hamburger) {
    hamburger.innerHTML = iconMenu({ size: 20 });
    hamburger.setAttribute('aria-label', 'Open navigation menu');
  }
}

function initSearch(navbar, placeholder, onSearchCallback) {
  const input = navbar.querySelector('.navbar__search-input');
  if (!input) return;

  input.setAttribute('placeholder', placeholder);

  const clearBtn = navbar.querySelector('.navbar__search-clear');
  if (clearBtn) {
    clearBtn.innerHTML = iconClose({ size: 16 });
    clearBtn.setAttribute('aria-label', 'Clear search');
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.focus();
      input.classList.remove('has-value');
      if (onSearchCallback) onSearchCallback('');
    });
  }

  input.addEventListener('input', () => {
    input.classList.toggle('has-value', !!input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && onSearchCallback) {
      e.preventDefault();
      onSearchCallback(input.value.trim());
    }
  });
}

function initMobileSearch(navbar) {
  const toggle = navbar.querySelector('.navbar__search-toggle');
  const mobileSearch = document.querySelector('.navbar__search-mobile');
  if (!toggle || !mobileSearch) return;

  toggle.addEventListener('click', () => {
    const isOpen = mobileSearch.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
    if (isOpen) {
      const input = mobileSearch.querySelector('input');
      if (input) setTimeout(() => input.focus(), 100);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileSearch.classList.contains('is-open')) {
      mobileSearch.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function initHamburger(navbar) {
  const hamburger = navbar.querySelector('.navbar__hamburger');
  const sidebar = document.querySelector('.admin-layout__sidebar');
  const backdrop = document.querySelector('.backdrop');
  if (!hamburger || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    if (backdrop) backdrop.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    if (backdrop) backdrop.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    if (sidebar.classList.contains('is-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      closeSidebar();
    }
  });
}