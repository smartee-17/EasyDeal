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
import { getDashboardStats } from '../../services/dashboardService.js';
import { iconUser, iconStore, iconShoppingBag, iconCheck, iconX, iconAlertTriangle } from '../../components/icons/icons.js';

initTheme();
initNavbar({ context: 'admin', searchPlaceholder: 'Search dashboard...' });
initSidebar();
initFooter();

const statsGrid = document.getElementById('statsGrid');
const overviewBody = document.getElementById('overviewTableBody');

const STAT_CONFIG = [
  { key: 'users.total', label: 'Total Users', icon: iconUser, iconClass: 'stat-card__icon--info', meta: 'Active accounts' },
  { key: 'sellers.total', label: 'Total Sellers', icon: iconStore, iconClass: 'stat-card__icon--primary', meta: 'Registered sellers' },
  { key: 'users.blocked', label: 'Blocked Users', icon: iconX, iconClass: 'stat-card__icon--danger', meta: 'Suspended accounts' },
  { key: 'sellers.blocked', label: 'Blocked Sellers', icon: iconAlertTriangle, iconClass: 'stat-card__icon--warning', meta: 'Suspended sellers' },
  { key: 'sellers.verified', label: 'Verified Sellers', icon: iconCheck, iconClass: 'stat-card__icon--success', meta: 'Approved sellers' },
  { key: 'products.total', label: 'Total Products', icon: iconShoppingBag, iconClass: 'stat-card__icon--primary', meta: 'Listed items' },
];

async function loadDashboard() {
  const authed = await initAuthGuard();
  if (!authed) return;

  try {
    const response = await getDashboardStats();

    // Temporary development logging — remove once verified in production
    console.log('[Dashboard] Overview response:', response);
    console.log('[Dashboard] Overview data:', response.data);

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
      <div class="stat-card">
        <div class="stat-card__header">
          <span class="stat-card__icon ${cfg.iconClass}">${cfg.icon({ size: 20 })}</span>
          <span class="stat-card__meta">${cfg.meta}</span>
        </div>
        <div class="stat-card__value">${formatNumber(value)}</div>
        <div class="stat-card__label">${cfg.label}</div>
      </div>
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
    { label: 'Total Orders', value: formatNumber(getNestedValue(stats, 'orders.total')) },
    { label: 'Total Revenue', value: formatCurrency(getNestedValue(stats, 'revenue.total')) },
    { label: 'Pending Orders', value: formatNumber(getNestedValue(stats, 'orders.pending')) },
    { label: 'Pending Withdrawals', value: formatNumber(getNestedValue(stats, 'withdrawals.pending')) },
    { label: 'Pending Disputes', value: formatNumber(getNestedValue(stats, 'disputes.pending')) },
    { label: 'Pending Refunds', value: formatNumber(getNestedValue(stats, 'refunds.pending')) },
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

function formatCurrency(n) {
  if (n === undefined || n === null) return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

loadDashboard();