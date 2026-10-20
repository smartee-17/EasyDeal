/* ============================================================
   EASYDEAL — DASHBOARD PAGE JS
   Purpose: Fetch and display dashboard stats
   ============================================================ */

import { initTheme } from '../../utils/theme.js';
import { initNavbar } from '../../components/navbar/navbar.js';
import { initSidebar } from '../../components/sidebar/sidebar.js';
import { initFooter } from '../../components/footer/footer.js';
import { showToast } from '../../components/toast/toast.js';
import { initAuthGuard } from '../../services/authService.js';
import { getDashboardStats, searchProducts } from '../../services/dashboardService.js';
import { iconUser, iconStore, iconShoppingBag, iconCheck, iconX, iconAlertTriangle, iconChevronRight } from '../../components/icons/icons.js';

initTheme();

let searchDebounceTimer = null;

function handleDashboardSearch(query) {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    if (!query.trim()) {
      closeSearchResults(navbar);
      return;
    }

    try {
      const response = await searchProducts(query);
      const products = response.data?.products || [];
      renderSearchResults(navbar, products, handleSearchResultClick);
    } catch (error) {
      console.error('[Dashboard] search error:', error);
      showToast({ type: 'error', title: 'Search failed', message: error.message || 'Could not search products.' });
      closeSearchResults(navbar);
    }
  }, 250);
}

function handleSearchResultClick(item) {
  if (item?._id || item?.id) {
    window.location.href = `../products/products.html?id=${item._id || item.id}`;
  }
}

function closeSearchResults(navbar) {
  const results = navbar.querySelector('.navbar__search-results');
  if (results) results.remove();
}

function renderSearchResults(navbar, products, onResultClick) {
  const searchWrapper = navbar.querySelector('.navbar__search');
  if (!searchWrapper) return;

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'navbar__search-results';
  resultsContainer.setAttribute('role', 'listbox');
  resultsContainer.setAttribute('aria-label', 'Search results');

  if (!products || products.length === 0) {
    resultsContainer.innerHTML = `
      <div class="navbar__search-result-empty">
        No products found
      </div>
    `;
  } else {
    resultsContainer.innerHTML = products.map((product, index) => `
      <button type="button" class="navbar__search-result-item" data-index="${index}" role="option" tabindex="-1">
        <span class="navbar__search-result-title">${escapeHtml(product.title || 'Untitled')}</span>
        <span class="navbar__search-result-subtitle">${escapeHtml(product.category || '—')}</span>
        <span class="navbar__search-result-icon" aria-hidden="true">${iconChevronRight({ size: 16 })}</span>
      </button>
    `).join('');

    resultsContainer.querySelectorAll('.navbar__search-result-item').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const product = products[index];
        if (product && onResultClick) {
          onResultClick(product);
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

initNavbar({ context: 'admin', searchPlaceholder: 'Search products...', onSearch: handleDashboardSearch });
initSidebar();
initFooter();

const statsGrid = document.getElementById('statsGrid');
const overviewBody = document.getElementById('overviewTableBody');

const STAT_CONFIG = [
  { key: 'users.total', label: 'Total Users', icon: iconUser, iconClass: 'stat-card__icon--info', meta: 'Active accounts', link: '../users/users.html' },
  { key: 'sellers.total', label: 'Total Sellers', icon: iconStore, iconClass: 'stat-card__icon--primary', meta: 'Registered sellers', link: '../users/users.html' },
  { key: 'users.blocked', label: 'Blocked Users', icon: iconX, iconClass: 'stat-card__icon--danger', meta: 'Suspended accounts', link: '../users/users.html' },
  { key: 'sellers.blocked', label: 'Blocked Sellers', icon: iconAlertTriangle, iconClass: 'stat-card__icon--warning', meta: 'Suspended sellers', link: '../users/users.html' },
  { key: 'sellers.verified', label: 'Verified Sellers', icon: iconCheck, iconClass: 'stat-card__icon--success', meta: 'Approved sellers', link: '../users/users.html' },
  { key: 'products.total', label: 'Total Products', icon: iconShoppingBag, iconClass: 'stat-card__icon--primary', meta: 'Listed items', link: '../products/products.html' },
];

async function loadDashboard() {
  const authed = await initAuthGuard();
  if (!authed) return;

  try {
    const response = await getDashboardStats();

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch dashboard stats');
    }

    const stats = response.data || {};
    renderStats(stats);
    renderOverview(stats);
  } catch (error) {
    console.error('[Dashboard] load error:', error);
    showToast({ type: 'error', title: 'Failed to load', message: error.message || 'Could not fetch dashboard data.' });
    renderStats({});
    renderOverview({});
  }
}

function renderStats(stats) {
  statsGrid.innerHTML = STAT_CONFIG.map(cfg => {
    const value = getNestedValue(stats, cfg.key);
    if (value === undefined) {
      console.error(`[Dashboard] Required stat field missing: ${cfg.key}`);
    }
    return `
      <a href="${cfg.link}" class="stat-card stat-card--link">
        <div class="stat-card__header">
          <span class="stat-card__icon ${cfg.iconClass}">${cfg.icon({ size: 20 })}</span>
          <span class="stat-card__meta">${cfg.meta}</span>
        </div>
        <div class="stat-card__value">${formatNumber(value)}</div>
        <div class="stat-card__label">${cfg.label}</div>
      </a>
    `;
  }).join('');
}

function renderOverview(stats) {
  const rows = [
    { label: 'Total Users', value: formatNumber(getNestedValue(stats, 'users.total')) },
    { label: 'Blocked Users', value: formatNumber(getNestedValue(stats, 'users.blocked')) },
    { label: 'Total Sellers', value: formatNumber(getNestedValue(stats, 'sellers.total')) },
    { label: 'Verified Sellers', value: formatNumber(getNestedValue(stats, 'sellers.verified')) },
    { label: 'Blocked Sellers', value: formatNumber(getNestedValue(stats, 'sellers.blocked')) },
    { label: 'Total Products', value: formatNumber(getNestedValue(stats, 'products.total')) },
  ];

  overviewBody.innerHTML = rows.map(row => `
    <tr>
      <td class="data-table__cell data-table__cell--label">${row.label}</td>
      <td class="data-table__cell data-table__cell--value">${row.value}</td>
    </tr>
  `).join('');
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key] !== undefined ? acc[key] : undefined;
  }, obj);
}

function formatNumber(n) {
  if (n === undefined || n === null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString();
}

loadDashboard();