/* ============================================================
   EASYDEAL — NAVBAR COMPONENT
   Purpose: Shared navbar behavior (search, mobile, theme)
   ============================================================ */

import { updateBodyScrollLock } from '../modal/modal.js';
import { iconSearch, iconClose, iconMenu, iconSun, iconMoon, iconChevronRight } from '../icons/icons.js';

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
      closeSearchResults(navbar);
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
    if (e.key === 'Escape') {
      closeSearchResults(navbar);
      input.blur();
    }
  });

  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    const searchWrapper = navbar.querySelector('.navbar__search');
    const results = navbar.querySelector('.navbar__search-results');
    if (searchWrapper && results && !searchWrapper.contains(e.target) && !results.contains(e.target)) {
      closeSearchResults(navbar);
    }
  });

  // Focus handling
  input.addEventListener('focus', () => {
    if (onSearchCallback && input.value.trim()) {
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
    } else {
      closeSearchResults(navbar);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileSearch.classList.contains('is-open')) {
      mobileSearch.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      closeSearchResults(navbar);
    }
  });

  // Mobile search input handling
  const mobileInput = mobileSearch.querySelector('.navbar__search-input');
  if (mobileInput) {
    mobileInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        mobileSearch.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        closeSearchResults(navbar);
        mobileInput.blur();
      }
    });
  }
}

function closeSearchResults(navbar) {
  const results = navbar.querySelector('.navbar__search-results');
  if (results) {
    results.remove();
  }
}

function renderSearchResults(navbar, results, onResultClick) {
  closeSearchResults(navbar);

  const searchWrapper = navbar.querySelector('.navbar__search');
  if (!searchWrapper) return;

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'navbar__search-results';
  resultsContainer.setAttribute('role', 'listbox');
  resultsContainer.setAttribute('aria-label', 'Search results');

  if (!results || results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="navbar__search-result-empty">
        No results found
      </div>
    `;
  } else {
    resultsContainer.innerHTML = results.map((item, index) => `
      <button type="button" class="navbar__search-result-item" data-index="${index}" role="option" tabindex="-1">
        <span class="navbar__search-result-title">${escapeHtml(item.title)}</span>
        ${item.subtitle ? `<span class="navbar__search-result-subtitle">${escapeHtml(item.subtitle)}</span>` : ''}
        <span class="navbar__search-result-icon" aria-hidden="true">${iconChevronRight({ size: 16 })}</span>
      </button>
    `).join('');

    resultsContainer.querySelectorAll('.navbar__search-result-item').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const item = results[index];
        if (item && onResultClick) {
          onResultClick(item);
        }
        closeSearchResults(navbar);
        const input = navbar.querySelector('.navbar__search-input');
        if (input) input.value = '';
      });
    });
  }

  searchWrapper.appendChild(resultsContainer);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
    updateBodyScrollLock();
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    if (backdrop) backdrop.classList.remove('is-visible');
    updateBodyScrollLock();
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