/* ============================================================
   EASYDEAL — SIDEBAR COMPONENT
   Purpose: Sidebar navigation behavior
   ============================================================ */

import { iconClose, iconDashboard, iconStore, iconShoppingBag, iconUser, iconLogout } from '../icons/icons.js';
import { logout, redirectToLogin } from '../../services/authService.js';

export function initSidebar() {
  highlightActiveLink();
  renderIcons();
  initCloseButton();
  initLogout();
}

function highlightActiveLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.sidebar__link');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const normalizedHref = href.replace('./', '').replace('.html', '');
    if (currentPath.includes(normalizedHref)) {
      link.classList.add('is-active');
    } else {
      link.classList.remove('is-active');
    }
  });
}

function renderIcons() {
  const iconMap = {
    'close': () => iconClose({ size: 20 }),
    'dashboard': () => iconDashboard({ size: 20 }),
    'products': () => iconStore({ size: 20 }),
    'product-management': () => iconShoppingBag({ size: 20 }),
    'users': () => iconUser({ size: 20 }),
    'logout': () => iconLogout({ size: 20 }),
  };

  document.querySelectorAll('[data-render-icon]').forEach(el => {
    const key = el.getAttribute('data-render-icon');
    const iconFn = iconMap[key];
    if (iconFn && !el.querySelector('svg')) {
      el.innerHTML = iconFn();
    }
  });
}

function initCloseButton() {
  const closeBtn = document.querySelector('.sidebar__close');
  const sidebar = document.querySelector('.admin-layout__sidebar');
  const backdrop = document.querySelector('.backdrop');
  if (!closeBtn || !sidebar) return;

  closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-visible');
    document.body.style.overflow = '';
  });
}

function initLogout() {
  const logoutBtn = document.querySelector('.sidebar__logout');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    logoutBtn.disabled = true;
    try {
      await logout();
    } catch (err) {
      console.error('[Sidebar] logout error:', err);
    } finally {
      redirectToLogin();
    }
  });
}