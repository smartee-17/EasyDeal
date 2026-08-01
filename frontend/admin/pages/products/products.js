/* ============================================================
   EASYDEAL — PRODUCTS PAGE JS
   Purpose: Product listing, details modal, delete
   ============================================================ */

import { initTheme } from '../../utils/theme.js';
import { initNavbar } from '../../components/navbar/navbar.js';
import { initSidebar } from '../../components/sidebar/sidebar.js';
import { initFooter } from '../../components/footer/footer.js';
import { showToast } from '../../components/toast/toast.js';
import { openModal, closeModal } from '../../components/modal/modal.js';
import { initAuthGuard } from '../../services/authService.js';
import { getAllProducts, getSingleProduct, deleteProduct } from '../../services/dashboardService.js';
import { iconEye, iconTrash2 } from '../../components/icons/icons.js';

initTheme();
initNavbar({ context: 'admin', searchPlaceholder: 'Search products...' });
initSidebar();
initFooter();

const tableBody = document.getElementById('productsTableBody');
const emptyState = document.getElementById('productsEmpty');
let allProducts = [];

async function loadProducts() {
  const authed = await initAuthGuard();
  if (!authed) return;

  try {
    const response = await getAllProducts();
    allProducts = response.data?.products || [];
    renderProducts(allProducts);
  } catch (error) {
    console.error('[Products] load error:', error);
    showToast({ type: 'error', title: 'Failed to load', message: error.message || 'Could not fetch products.' });
    renderProducts([]);
  }
}

function renderProducts(products) {
  if (!products || products.length === 0) {
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tableBody.innerHTML = products.map(p => `
    <tr data-id="${p._id || p.id}">
      <td class="data-table__cell">${escapeHtml(p.title || 'Untitled')}</td>
      <td class="data-table__cell">${formatCurrency(p.price)}</td>
      <td class="data-table__cell">${escapeHtml(p.category || '—')}</td>
      <td class="data-table__cell">${escapeHtml(p.seller?.name || p.sellerName || '—')}</td>
      <td class="data-table__cell">${escapeHtml(p.seller?.email || p.sellerEmail || '—')}</td>
      <td class="data-table__cell">${formatDate(p.createdAt)}</td>
      <td class="data-table__cell">
        <div class="table-actions">
          <button type="button" class="table-actions__btn" data-action="view" data-id="${p._id || p.id}" aria-label="View product">
            ${iconEye({ size: 16 })}
          </button>
          <button type="button" class="table-actions__btn table-actions__btn--danger" data-action="delete" data-id="${p._id || p.id}" aria-label="Delete product">
            ${iconTrash2({ size: 16 })}
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tableBody.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => handleView(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
}

async function handleView(id) {
  try {
    const response = await getSingleProduct(id);
    const p = response.data?.product;
    if (!p) {
      showToast({ type: 'error', title: 'Not found', message: 'Product not found.' });
      return;
    }

    openModal({
      title: 'Product Details',
      icon: 'info',
      showCancel: false,
      confirmText: 'Close',
      content: `
        <div class="modal__details-row">
          <span class="modal__details-label">Title</span>
          <span class="modal__details-value">${escapeHtml(p.title || '—')}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Price</span>
          <span class="modal__details-value">${formatCurrency(p.price)}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Category</span>
          <span class="modal__details-value">${escapeHtml(p.category || '—')}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Seller</span>
          <span class="modal__details-value">${escapeHtml(p.seller?.name || p.sellerName || '—')}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Seller Email</span>
          <span class="modal__details-value">${escapeHtml(p.seller?.email || p.sellerEmail || '—')}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Created</span>
          <span class="modal__details-value">${formatDate(p.createdAt)}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Description</span>
          <span class="modal__details-value">${escapeHtml(p.description || '—')}</span>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Products] view error:', error);
    showToast({ type: 'error', title: 'Error', message: error.message || 'Could not load product details.' });
  }
}

function handleDelete(id) {
  const product = allProducts.find(p => (p._id || p.id) === id);
  const title = product?.title || 'this product';

  openModal({
    title: 'Delete Product?',
    message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
    icon: 'warning',
    danger: true,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await deleteProduct(id);
        showToast({ type: 'success', title: 'Deleted', message: `"${title}" has been deleted.` });
        allProducts = allProducts.filter(p => (p._id || p.id) !== id);
        renderProducts(allProducts);
      } catch (error) {
        console.error('[Products] delete error:', error);
        showToast({ type: 'error', title: 'Delete failed', message: error.message || 'Could not delete product.' });
      }
    },
  });
}

function escapeHtml(str) {
  if (!str) return '—';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatCurrency(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

loadProducts();