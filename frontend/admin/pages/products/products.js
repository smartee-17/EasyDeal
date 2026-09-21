/* ============================================================
   EASYDEAL — PRODUCTS PAGE JS
   Purpose: Product listing, details modal, delete, filtering
   ============================================================ */

import { initTheme } from '../../utils/theme.js';
import { initNavbar } from '../../components/navbar/navbar.js';
import { initSidebar } from '../../components/sidebar/sidebar.js';
import { initFooter } from '../../components/footer/footer.js';
import { showToast } from '../../components/toast/toast.js';
import { openModal, openCustomModal, closeModal, updateBodyScrollLock } from '../../components/modal/modal.js';
import { initAuthGuard } from '../../services/authService.js';
import { getAllProducts, getProductFull, updateProduct, deleteProduct, searchProducts } from '../../services/dashboardService.js';
import { iconEye, iconEdit, iconTrash2, iconChevronRight, iconImage, iconClose, iconLaptop, iconShirt, iconHome, iconBook, iconDumbbell, iconSparkles, iconUtensils, iconTruck, iconCar, iconPackage } from '../../components/icons/icons.js';

initTheme();

let searchDebounceTimer = null;

function handleProductSearch(query) {
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
      console.error('[Products] search error:', error);
      showToast({ type: 'error', title: 'Search failed', message: error.message || 'Could not search products.' });
      closeSearchResults(navbar);
    }
  }, 250);
}

function handleSearchResultClick(item) {
  if (item?._id || item?.id) {
    handleView(item._id || item.id);
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

initNavbar({ context: 'admin', searchPlaceholder: 'Search products...', onSearch: handleProductSearch });
initSidebar();
initFooter();

const tableBody = document.getElementById('productsTableBody');
const emptyState = document.getElementById('productsEmpty');
const paginationControls = document.getElementById('paginationControls');
const tableSearchInput = document.getElementById('tableSearchInput');
const filterCategory = document.getElementById('filterCategory');
const filterAvailability = document.getElementById('filterAvailability');
const filterSeller = document.getElementById('filterSeller');
const filterLocation = document.getElementById('filterLocation');

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 8;

async function loadProducts() {
  const authed = await initAuthGuard();
  if (!authed) return;

  try {
    const response = await getAllProducts();
    allProducts = response.data?.products || [];
    filteredProducts = [...allProducts];
    populateFilterOptions();
    currentPage = 1;
    renderProducts();
  } catch (error) {
    console.error('[Products] load error:', error);
    showToast({ type: 'error', title: 'Failed to load', message: error.message || 'Could not fetch products.' });
    renderProducts([]);
  }
}

function populateFilterOptions() {
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const sellers = [...new Set(allProducts.map(p => p.seller?.name || p.sellerName).filter(Boolean))];
  const locations = [...new Set(allProducts.map(p => p.location).filter(Boolean))];

  filterCategory.innerHTML = '<option value="">Category</option>' +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(capitalizeFirst(c))}</option>`).join('');

  filterSeller.innerHTML = '<option value="">Seller</option>' +
    sellers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

  filterLocation.innerHTML = '<option value="">Location</option>' +
    locations.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
}

function applyFilters() {
  const searchTerm = (tableSearchInput?.value || '').trim().toLowerCase();
  const categoryVal = filterCategory?.value || '';
  const availabilityVal = filterAvailability?.value || '';
  const sellerVal = filterSeller?.value || '';
  const locationVal = filterLocation?.value || '';

  filteredProducts = allProducts.filter(p => {
    if (searchTerm) {
      const title = (p.title || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const sellerName = (p.seller?.name || p.sellerName || '').toLowerCase();
      if (!title.includes(searchTerm) && !cat.includes(searchTerm) && !sellerName.includes(searchTerm)) {
        return false;
      }
    }

    if (categoryVal && p.category !== categoryVal) return false;

    if (availabilityVal) {
      const isAvail = p.isAvailable !== false;
      if (availabilityVal === 'available' && !isAvail) return false;
      if (availabilityVal === 'unavailable' && isAvail) return false;
    }

    if (sellerVal) {
      const pSeller = p.seller?.name || p.sellerName || '';
      if (pSeller !== sellerVal) return false;
    }

    if (locationVal && p.location !== locationVal) return false;

    return true;
  });

  currentPage = 1;
  renderProducts();
}

function renderProducts() {
  if (!filteredProducts || filteredProducts.length === 0) {
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    renderPagination(0);
    return;
  }
  emptyState.classList.add('hidden');

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * productsPerPage;
  const pageProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  tableBody.innerHTML = pageProducts.map(p => {
    const productId = p._id || p.id;
    const imageUrl = getProductImageUrl(p);
    const productName = escapeHtml(p.title || 'Untitled');
    const category = formatCategory(p.category);
    const price = formatCurrency(p.price);
    const sellerName = escapeHtml(p.seller?.name || p.sellerName || '—');
    const location = escapeHtml(p.location || '—');
    const tags = renderTags(p.tags);
    const availability = p.isAvailable !== undefined ? renderAvailability(p.isAvailable) : '<span class="availability-cell"><span class="availability-dot availability-dot--unknown"></span><span class="availability-text">Unknown</span></div>';
    const updated = p.updatedAt ? formatRelativeTime(p.updatedAt) : (p.createdAt ? formatRelativeTime(p.createdAt) : '—');
    const placeholderIcon = getCategoryIcon(p.category)({ size: 16 });
    const imageHtml = imageUrl
      ? `<img src="${imageUrl}" alt="" class="product-cell__img" loading="lazy" data-product-id="${productId}" />`
      : `<span class="product-cell__img-placeholder" title="${formatCategory(p.category)}">${placeholderIcon}</span>`;

    return `
      <tr data-id="${productId}">
        <td class="data-table__cell" data-label="Product">
          <div class="product-cell">
            ${imageHtml}
            <div class="product-cell__info">
              <span class="product-cell__title">${productName}</span>
            </div>
          </div>
        </td>
        <td class="data-table__cell" data-label="Category">${category}</td>
        <td class="data-table__cell" data-label="Price">${price}</td>
        <td class="data-table__cell" data-label="Seller">
          <span class="seller-cell" title="${sellerName}">${sellerName}</span>
        </td>
        <td class="data-table__cell" data-label="Location">
          <span class="location-cell" title="${location}">${location}</span>
        </td>
        <td class="data-table__cell" data-label="Tags"><div class="tags-cell">${tags || '<span class="tag-badge tag-badge--empty">—</span>'}</div></td>
        <td class="data-table__cell" data-label="Availability">${availability}</td>
        <td class="data-table__cell" data-label="Updated">${updated}</td>
        <td class="data-table__cell" data-label="Actions">
          <div class="table-actions">
            <button type="button" class="table-actions__btn" data-action="view" data-id="${productId}" aria-label="View product">
              ${iconEye({ size: 16 })}
            </button>
            <button type="button" class="table-actions__btn" data-action="edit" data-id="${productId}" aria-label="Edit product">
              ${iconEdit({ size: 16 })}
            </button>
            <button type="button" class="table-actions__btn table-actions__btn--danger" data-action="delete" data-id="${productId}" aria-label="Delete product">
              ${iconTrash2({ size: 16 })}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => handleView(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => handleEdit(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });

  tableBody.querySelectorAll('.product-cell__img[data-product-id]').forEach(img => {
    img.addEventListener('error', function handleImgError() {
      const productId = this.dataset.productId;
      const product = filteredProducts.find(p => (p._id || p.id) === productId);
      const categoryIcon = product ? getCategoryIcon(product.category)({ size: 16 }) : iconImage({ size: 16 });
      const placeholder = document.createElement('span');
      placeholder.className = 'product-cell__img-placeholder';
      placeholder.innerHTML = categoryIcon;
      placeholder.title = product ? formatCategory(product.category) : '';
      this.replaceWith(placeholder);
      img.removeEventListener('error', handleImgError);
    });
  });

  renderPagination(filteredProducts.length);
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / productsPerPage);
  if (!paginationControls) return;

  if (totalPages <= 1) {
    paginationControls.innerHTML = '';
    return;
  }

  let html = '';

  html += `<button type="button" class="products-pagination__btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  </button>`;

  const pages = getPageNumbers(currentPage, totalPages);
  pages.forEach(page => {
    if (page === '...') {
      html += `<span class="products-pagination__ellipsis">...</span>`;
    } else {
      html += `<button type="button" class="products-pagination__btn ${page === currentPage ? 'products-pagination__btn--active' : ''}" data-page="${page}" aria-label="Page ${page}" ${page === currentPage ? 'aria-current="page"' : ''}>${page}</button>`;
    }
  });

  html += `<button type="button" class="products-pagination__btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </button>`;

  paginationControls.innerHTML = html;

  paginationControls.querySelectorAll('.products-pagination__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page === 'prev') {
        if (currentPage > 1) {
          currentPage--;
          renderProducts();
        }
      } else if (page === 'next') {
        if (currentPage < totalPages) {
          currentPage++;
          renderProducts();
        }
      } else {
        const pageNum = parseInt(page, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          currentPage = pageNum;
          renderProducts();
        }
      }
    });
  });
}

function getPageNumbers(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);
  return pages;
}

function getProductImageUrl(product) {
  if (product.images && product.images.length > 0 && product.images[0].url) {
    return product.images[0].url;
  }
  return '';
}

function renderTags(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return '';
  }
  return tags.map(tag => {
    // Handle ObjectId (from admin endpoints), populated objects, or strings
    let label = '';
    if (typeof tag === 'string') {
      label = tag;
    } else if (tag && typeof tag === 'object') {
      // Mongoose ObjectId has toString() method
      if (typeof tag.toString === 'function' && tag.toString().match(/^[0-9a-fA-F]{24}$/)) {
        label = tag.toString().slice(-6); // Show last 6 chars of ObjectId as fallback
      } else {
        label = tag.name || tag.label || tag.title || '';
      }
    }
    if (!label) return '';
    return `<span class="tag-badge">${escapeHtml(label)}</span>`;
  }).join('');
}

function renderAvailability(isAvailable) {
  const available = isAvailable !== false;
  const dotClass = available ? 'availability-dot--available' : 'availability-dot--unavailable';
  const text = available ? 'Available' : 'Unavailable';
  return `<div class="availability-cell"><span class="availability-dot ${dotClass}"></span><span class="availability-text">${text}</span></div>`;
}

function formatCategory(category) {
  if (!category) return '—';
  return escapeHtml(capitalizeFirst(category));
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCategoryIcon(category) {
  const icons = {
    electronics: iconLaptop,
    clothing: iconShirt,
    furniture: iconHome,
    books: iconBook,
    sports: iconDumbbell,
    beauty: iconSparkles,
    food: iconUtensils,
    toys: iconPackage,
    automotive: iconCar,
    other: iconPackage,
  };
  return icons[category?.toLowerCase()] || iconPackage;
}

async function handleView(id) {
  const product = allProducts.find(p => (p._id || p.id) === id);
  if (!product) {
    showToast({ type: 'error', title: 'Not found', message: 'Product not found.' });
    return;
  }

  function buildContent(p) {
    const imgUrl = getProductImageUrl(p);
    return `
      ${imgUrl ? `<div style="margin-bottom:var(--space-4);text-align:center"><img src="${imgUrl}" alt="" style="max-width:200px;max-height:200px;border-radius:var(--radius-md);object-fit:cover;" onerror="this.onerror=null;this.src='';this.outerHTML='<span class=product-cell__img-placeholder title=${formatCategory(p.category)}>${getCategoryIcon(p.category)({ size: 48 })}</span>'" /></div>` : ''}
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
        <span class="modal__details-value">${formatCategory(p.category)}</span>
      </div>
      <div class="modal__details-row">
        <span class="modal__details-label">Seller</span>
        <span class="modal__details-value">${escapeHtml(p.seller?.name || p.sellerName || '—')}</span>
      </div>
      <div class="modal__details-row">
        <span class="modal__details-label">Seller Contact</span>
        <span class="modal__details-value">${escapeHtml(p.seller?.email || p.seller?.whatsappNumber || p.sellerEmail || '—')}</span>
      </div>
      <div class="modal__details-row">
        <span class="modal__details-label">Created</span>
        <span class="modal__details-value">${formatDate(p.createdAt)}</span>
      </div>
      <div class="modal__details-row">
        <span class="modal__details-label">Description</span>
        <span class="modal__details-value">${escapeHtml(p.description || '—')}</span>
      </div>
      ${p.location ? `
      <div class="modal__details-row">
        <span class="modal__details-label">Location</span>
        <span class="modal__details-value">${escapeHtml(p.location)}</span>
      </div>` : ''}
      ${p.tags && p.tags.length > 0 ? `
      <div class="modal__details-row">
        <span class="modal__details-label">Tags</span>
        <span class="modal__details-value">${renderTags(p.tags)}</span>
      </div>` : ''}
      ${p.isAvailable !== undefined ? `
      <div class="modal__details-row">
        <span class="modal__details-label">Availability</span>
        <span class="modal__details-value">${renderAvailability(p.isAvailable)}</span>
      </div>` : ''}
      ${p.specifications && p.specifications.length > 0 ? `
      <div class="modal__details-row">
        <span class="modal__details-label">Specifications</span>
        <span class="modal__details-value">${p.specifications.map(s => `${escapeHtml(s.label || s.key)}: ${escapeHtml(String(s.value))}`).join('; ')}</span>
      </div>` : ''}
    `;
  }

  const instance = openCustomModal({
    title: 'Product Details',
    icon: 'info',
    size: 'default',
    showClose: true,
    content: buildContent(product),
    className: 'modal-backdrop--details',
  });

  // Track this request to prevent race conditions (Product A overwriting Product B)
  const requestId = Symbol('view-request');
  instance._viewRequestId = requestId;

  try {
    const response = await getProductFull(id);
    const p = response.data;
    // Only update if this modal is still active AND this is the latest request for this instance
    if (p && instance.element.isConnected && instance._viewRequestId === requestId) {
      const modalContent = instance.element.querySelector('.modal__content');
      if (modalContent) {
        modalContent.innerHTML = buildContent(p);
      }
    }
  } catch (error) {
    console.error('[Products] view full load error:', error);
    // Show user-friendly error but keep modal open with available data
    showToast({ type: 'warning', title: 'Limited data', message: 'Could not load full product details. Showing available information.' });
  }
}

function handleEdit(id) {
  openEditModal(id);
}

const CATEGORY_ATTRIBUTES = {
  electronics: [
    { key: 'brand', label: 'Brand', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', options: ['Phone', 'Tablet', 'Laptop', 'TV', 'Camera', 'Audio', 'Accessory', 'Other'], required: true },
    { key: 'ram', label: 'RAM', type: 'select', options: ['2GB', '4GB', '6GB', '8GB', '16GB', '32GB', '64GB', 'N/A'], required: false },
    { key: 'storage', label: 'Storage', type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB', 'N/A'], required: false },
    { key: 'color', label: 'Color', type: 'text', required: false },
    { key: 'warranty', label: 'Warranty', type: 'select', options: ['No warranty', 'Under 6 months', '6-12 months', '1 year+'], required: false },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'], required: true },
  ],
  clothing: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'], required: true },
    { key: 'color', label: 'Color', type: 'text', required: true },
    { key: 'material', label: 'Material', type: 'text', required: false },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: true },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New with tags', 'New without tags', 'Used'], required: true },
  ],
  shoes: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'size', label: 'Size', type: 'select', options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'], required: true },
    { key: 'color', label: 'Color', type: 'text', required: true },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'], required: true },
    { key: 'material', label: 'Material', type: 'text', required: false },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Good', 'Used - Fair'], required: true },
  ],
  watches_jewelry: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'material', label: 'Material', type: 'select', options: ['Gold', 'Silver', 'Stainless steel', 'Leather', 'Plastic', 'Other'], required: true },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex'], required: false },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Like new', 'Used - Good'], required: true },
  ],
  home_kitchen: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'material', label: 'Material', type: 'text', required: false },
    { key: 'dimensions', label: 'Dimensions', type: 'text', required: false },
    { key: 'power_rating', label: 'Power rating', type: 'text', required: false },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'], required: true },
  ],
  furniture: [
    { key: 'material', label: 'Material', type: 'select', options: ['Wood', 'Metal', 'Glass', 'Plastic', 'Fabric', 'Leather', 'Mixed'], required: true },
    { key: 'dimensions', label: 'Dimensions (LxWxH)', type: 'text', required: false },
    { key: 'color', label: 'Color', type: 'text', required: false },
    { key: 'assembly_required', label: 'Assembly required', type: 'boolean', required: false },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'], required: true },
  ],
  beauty_personal_care: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'volume_weight', label: 'Volume / weight', type: 'text', required: false },
    { key: 'skin_hair_type', label: 'Skin / hair type', type: 'select', options: ['All types', 'Oily', 'Dry', 'Combination', 'Sensitive'], required: false },
    { key: 'expiry_date', label: 'Expiry date', type: 'text', required: false },
  ],
  groceries: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'weight_volume', label: 'Weight / volume', type: 'text', required: true },
    { key: 'expiry_date', label: 'Expiry date', type: 'text', required: false },
    { key: 'dietary_info', label: 'Dietary info', type: 'select', options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher'], required: false },
  ],
  books: [
    { key: 'author', label: 'Author', type: 'text', required: true },
    { key: 'genre', label: 'Genre', type: 'text', required: false },
    { key: 'language', label: 'Language', type: 'text', required: false },
    { key: 'format', label: 'Format', type: 'select', options: ['Hardcover', 'Paperback', 'E-book'], required: true },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'], required: true },
  ],
  toys_games: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'age_range', label: 'Age range', type: 'text', required: true },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Like new', 'Used - Good'], required: true },
  ],
  sports_outdoors: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'size', label: 'Size', type: 'text', required: false },
    { key: 'material', label: 'Material', type: 'text', required: false },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'], required: true },
  ],
  automotive: [
    { key: 'brand', label: 'Brand / make', type: 'text', required: true },
    { key: 'model', label: 'Model', type: 'text', required: false },
    { key: 'part_type', label: 'Part type', type: 'text', required: false },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Good', 'Used - Fair', 'For parts'], required: true },
  ],
  baby_products: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'age_range', label: 'Age range', type: 'text', required: true },
    { key: 'material', label: 'Material', type: 'text', required: false },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Like new', 'Used - Good'], required: true },
  ],
};

const CATEGORY_OPTIONS = [
  { key: 'electronics', label: 'Electronics' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'books', label: 'Books' },
  { key: 'sports', label: 'Sports' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'food', label: 'Food' },
  { key: 'toys', label: 'Toys' },
  { key: 'automotive', label: 'Automotive' },
  { key: 'other', label: 'Other' },
];

let editModalState = {
  product: null,
  newImages: [],
  removedImages: [],
  tags: [],
  specifications: [],
};

async function openEditModal(id) {
  // First, find product from already loaded list data
  const product = allProducts.find(p => (p._id || p.id) === id);
  if (!product) {
    showToast({ type: 'error', title: 'Not found', message: 'Product not found.' });
    return;
  }

  // Build initial edit modal content from list data
  const productId = product._id || product.id;
  const productLabel = product.title ? `${product.title}` : 'Untitled';
  const productIdShort = productId ? productId.slice(-6).toUpperCase() : '';
  const existingImages = (product.images || []).map(img => ({ url: img.url, publicId: img.publicId, alt: img.alt || '' }));
  const existingTags = (product.tags || []).map(tag => typeof tag === 'string' ? tag : (tag.name || tag.label || ''));
  const existingSpecs = (product.specifications || []).map(s => ({ key: s.key, label: s.label || s.key, value: s.value }));

  editModalState = {
    product: product,
    newImages: [],
    removedImages: [],
    tags: existingTags.filter(Boolean),
    specifications: existingSpecs,
  };

  const content = `
    <div class="edit-modal__custom">
      <div class="edit-modal__body">
        <div class="edit-modal__section">
          <label class="edit-modal__label" for="editTitle">Product title</label>
          <input type="text" id="editTitle" class="edit-modal__input" value="${escapeHtml(product.title || '')}" required />
        </div>

        <div class="edit-modal__section">
          <label class="edit-modal__label" for="editDescription">Product description</label>
          <textarea id="editDescription" class="edit-modal__textarea" rows="4">${escapeHtml(product.description || '')}</textarea>
        </div>

        <div class="edit-modal__row edit-modal__row--4">
          <div class="edit-modal__field">
            <label class="edit-modal__label" for="editPrice">Price</label>
            <input type="number" id="editPrice" class="edit-modal__input" value="${product.price || ''}" step="0.01" min="0" required />
          </div>
          <div class="edit-modal__field">
            <label class="edit-modal__label" for="editCategory">Category</label>
            <div class="edit-modal__select-wrap">
              <select id="editCategory" class="edit-modal__select">
                ${CATEGORY_OPTIONS.map(c => `<option value="${c.key}" ${product.category === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}
              </select>
              <span class="edit-modal__select-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </div>
          </div>
          <div class="edit-modal__field">
            <label class="edit-modal__label" for="editLocation">Location</label>
            <input type="text" id="editLocation" class="edit-modal__input" value="${escapeHtml(product.location || '')}" />
          </div>
          <div class="edit-modal__field">
            <label class="edit-modal__label">Availability</label>
            <label class="edit-modal__toggle">
              <input type="checkbox" id="editAvailability" ${product.isAvailable !== false ? 'checked' : ''} />
              <span class="edit-modal__toggle-slider"></span>
              <span class="edit-modal__toggle-label">Is Available</span>
            </label>
          </div>
        </div>

        <div class="edit-modal__section">
          <label class="edit-modal__label">Tags</label>
          <div class="edit-modal__tags" id="editTagsContainer">
            ${editModalState.tags.map((tag, i) => `<span class="edit-modal__tag">${escapeHtml(tag)}<button type="button" class="edit-modal__tag-remove" data-tag-index="${i}" aria-label="Remove tag">${iconClose({ size: 12 })}</button></span>`).join('')}
            <input type="text" id="editTagInput" class="edit-modal__tag-input" placeholder="Search or add tags...." />
          </div>
        </div>

        <div class="edit-modal__section">
          <label class="edit-modal__label">Product Images</label>
          <div class="edit-modal__images" id="editImagesContainer">
            ${existingImages.map((img, i) => `<div class="edit-modal__image-thumb" data-existing-index="${i}"><img src="${img.url}" alt="" /><button type="button" class="edit-modal__image-remove" data-existing-index="${i}" aria-label="Remove image">${iconClose({ size: 12 })}</button></div>`).join('')}
          </div>
          <div class="edit-modal__images-actions">
            <label class="edit-modal__btn-add-image" for="editImageInput">+ Add Image</label>
            <input type="file" id="editImageInput" accept="image/jpeg,image/png,image/webp" multiple class="edit-modal__file-input" />
            <button type="button" class="edit-modal__btn-alt-text" id="editAltTextBtn">Edit Alt Text</button>
          </div>
        </div>

        <div class="edit-modal__section">
          <label class="edit-modal__label">Dynamic Specifications</label>
          <p class="edit-modal__hint">The fields change based on the selected category (<span id="editCategoryLabel">${getCategoryLabel(product.category)}</span>)</p>
          <div class="edit-modal__specs" id="editSpecsContainer"></div>
        </div>
      </div>

      <div class="edit-modal__footer">
        <button type="button" class="btn btn--ghost edit-modal__cancel">Cancel</button>
        <button type="button" class="btn btn--primary edit-modal__save">Save Changes</button>
        <button type="button" class="btn btn--outline-danger edit-modal__delete">Delete Product</button>
      </div>
    </div>
  `;

  const instance = openCustomModal({
    title: `Edit Product: ${escapeHtml(productLabel)}`,
    content,
    icon: '',
    size: 'large',
    showClose: false,
    className: 'modal-backdrop--edit',
  });

  initEditModalEvents(instance);
  renderEditSpecs(instance.element, product.category, existingSpecs);

  // Optionally fetch full product data in background to enrich the form
  try {
    const response = await getProductFull(id);
    const p = response.data;
    if (p && instance.element.isConnected) {
      // Update modal state with full data
      editModalState.product = p;
      const existingImages = (p.images || []).map(img => ({ url: img.url, publicId: img.publicId, alt: img.alt || '' }));
      const existingTags = (p.tags || []).map(tag => typeof tag === 'string' ? tag : (tag.name || tag.label || ''));
      const existingSpecs = (p.specifications || []).map(s => ({ key: s.key, label: s.label || s.key, value: s.value }));
      editModalState.newImages = [];
      editModalState.removedImages = [];
      editModalState.tags = existingTags.filter(Boolean);
      editModalState.specifications = existingSpecs;
      // Update form fields that might have been missing
      const descInput = instance.element.querySelector('#editDescription');
      if (descInput) descInput.value = escapeHtml(p.description || '');
      const locInput = instance.element.querySelector('#editLocation');
      if (locInput) locInput.value = escapeHtml(p.location || '');
      const availInput = instance.element.querySelector('#editAvailability');
      if (availInput) availInput.checked = p.isAvailable !== false;
      // Re-render tags, images, specs with full data
      renderEditTags(instance.element);
      renderEditImages(instance.element);
      renderEditSpecs(instance.element, p.category, existingSpecs);
    }
  } catch (error) {
    console.error('[Products] edit full load error:', error);
    // Modal stays open with list data - user can still edit available fields
  }
}

function getCategoryLabel(key) {
  const cat = CATEGORY_OPTIONS.find(c => c.key === key);
  return cat ? cat.label : capitalizeFirst(key || '');
}

function renderEditSpecs(modal, category, existingSpecs) {
  const container = modal.querySelector('#editSpecsContainer');
  if (!container) return;

  const attrs = CATEGORY_ATTRIBUTES[category] || [];
  if (attrs.length === 0) {
    container.innerHTML = '<p class="edit-modal__no-specs">No specifications available for this category.</p>';
    return;
  }

  const specMap = new Map(existingSpecs.map(s => [s.key, s.value]));

  container.innerHTML = attrs.map(attr => {
    const currentValue = specMap.get(attr.key) || '';
    if (attr.type === 'select') {
      return `
        <div class="edit-modal__spec-field">
          <label class="edit-modal__spec-label">${escapeHtml(attr.label)}${attr.required ? ' *' : ''}</label>
          <div class="edit-modal__select-wrap">
            <select class="edit-modal__select edit-modal__spec-input" data-spec-key="${attr.key}" ${attr.required ? 'required' : ''}>
              <option value="">Select...</option>
              ${attr.options.map(opt => `<option value="${escapeHtml(opt)}" ${currentValue === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
            </select>
            <span class="edit-modal__select-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        </div>
      `;
    } else if (attr.type === 'boolean') {
      return `
        <div class="edit-modal__spec-field">
          <label class="edit-modal__spec-label">${escapeHtml(attr.label)}</label>
          <label class="edit-modal__toggle edit-modal__toggle--sm">
            <input type="checkbox" class="edit-modal__spec-input" data-spec-key="${attr.key}" ${currentValue === true || currentValue === 'true' ? 'checked' : ''} />
            <span class="edit-modal__toggle-slider"></span>
          </label>
        </div>
      `;
    } else {
      return `
        <div class="edit-modal__spec-field">
          <label class="edit-modal__spec-label">${escapeHtml(attr.label)}${attr.required ? ' *' : ''}</label>
          <input type="${attr.type === 'number' ? 'number' : 'text'}" class="edit-modal__input edit-modal__spec-input" data-spec-key="${attr.key}" value="${escapeHtml(String(currentValue))}" ${attr.required ? 'required' : ''} />
        </div>
      `;
    }
  }).join('');
}

function openPreviewModal(product) {
  if (!product) return;

  const productId = product._id || product.id;
  const productIdShort = productId ? productId.slice(-6).toUpperCase() : '';
  const imageUrl = getProductImageUrl(product);
  const title = escapeHtml(product.title || 'Untitled');
  const price = formatCurrency(product.price);
  const category = formatCategory(product.category);
  const location = escapeHtml(product.location || '—');
  const availability = product.isAvailable !== false;
  const tags = renderTags(product.tags);
  const description = escapeHtml(product.description || '—');
  const specs = product.specifications || [];

  const content = `
    <div class="preview-modal__custom">
      <div class="preview-modal__header">
        <h2 class="preview-modal__title">Product Updated</h2>
        <span class="preview-modal__id">${productIdShort}</span>
      </div>

      <div class="preview-modal__body">
        ${imageUrl ? `
          <div class="preview-modal__image-wrapper">
            <img src="${imageUrl}" alt="${title}" class="preview-modal__image" />
          </div>
        ` : `
          <div class="preview-modal__image-wrapper preview-modal__image-wrapper--empty">
            <span class="preview-modal__image-placeholder">${getCategoryIcon(product.category)({ size: 48 })}</span>
          </div>
        `}

        <div class="preview-modal__content">
          <h3 class="preview-modal__product-title">${title}</h3>

          <div class="preview-modal__details-grid">
            <div class="preview-modal__detail-item">
              <span class="preview-modal__detail-label">Price</span>
              <span class="preview-modal__detail-value preview-modal__detail-value--price">${price}</span>
            </div>
            <div class="preview-modal__detail-item">
              <span class="preview-modal__detail-label">Category</span>
              <span class="preview-modal__detail-value">${category}</span>
            </div>
            <div class="preview-modal__detail-item">
              <span class="preview-modal__detail-label">Location</span>
              <span class="preview-modal__detail-value">${location}</span>
            </div>
            <div class="preview-modal__detail-item">
              <span class="preview-modal__detail-label">Availability</span>
              <span class="preview-modal__detail-value">
                <span class="preview-modal__availability ${availability ? 'preview-modal__availability--available' : 'preview-modal__availability--unavailable'}">
                  ${availability ? 'Available' : 'Unavailable'}
                </span>
              </span>
            </div>
          </div>

          ${tags ? `
            <div class="preview-modal__section">
              <span class="preview-modal__section-label">Tags</span>
              <div class="preview-modal__tags">${tags}</div>
            </div>
          ` : ''}

          <div class="preview-modal__section">
            <span class="preview-modal__section-label">Description</span>
            <p class="preview-modal__description">${description}</p>
          </div>

          ${specs.length > 0 ? `
            <div class="preview-modal__section">
              <span class="preview-modal__section-label">Specifications</span>
              <div class="preview-modal__specs">
                ${specs.map(s => `
                  <div class="preview-modal__spec-item">
                    <span class="preview-modal__spec-label">${escapeHtml(s.label || s.key)}</span>
                    <span class="preview-modal__spec-value">${escapeHtml(String(s.value))}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="preview-modal__footer">
        <button type="button" class="btn btn--primary preview-modal__close-btn">Close</button>
      </div>
    </div>
  `;

  const instance = openCustomModal({
    title: `Product Preview: ${title}`,
    content,
    icon: '',
    size: 'default',
    showClose: false,
    className: 'modal-backdrop--preview',
  });

  const closeBtn = instance.element.querySelector('.preview-modal__close-btn');
  closeBtn.addEventListener('click', () => instance.close(), { signal: instance.abortController.signal });
}

function initEditModalEvents(instance) {
  const modal = instance.element;
  const closeBtn = modal.querySelector('.edit-modal__cancel');
  const saveBtn = modal.querySelector('.edit-modal__save');
  const deleteBtn = modal.querySelector('.edit-modal__delete');
  const categorySelect = modal.querySelector('#editCategory');
  const tagInput = modal.querySelector('#editTagInput');
  const imageInput = modal.querySelector('#editImageInput');
  const altTextBtn = modal.querySelector('#editAltTextBtn');

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    instance.close();
  }, { signal: instance.abortController.signal });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) instance.close();
  }, { signal: instance.abortController.signal });

  const handleKey = (e) => {
    if (e.key === 'Escape') {
      instance.close();
    }
  };
  document.addEventListener('keydown', handleKey, { signal: instance.abortController.signal });

  categorySelect.addEventListener('change', () => {
    const label = modal.querySelector('#editCategoryLabel');
    if (label) label.textContent = getCategoryLabel(categorySelect.value);
    renderEditSpecs(modal, categorySelect.value, editModalState.specifications);
  }, { signal: instance.abortController.signal });

  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = tagInput.value.trim().replace(/,/g, '');
      if (value && !editModalState.tags.includes(value) && editModalState.tags.length < 5) {
        editModalState.tags.push(value);
        renderEditTags(modal);
      }
      tagInput.value = '';
    } else if (e.key === 'Backspace' && !tagInput.value && editModalState.tags.length > 0) {
      editModalState.tags.pop();
      renderEditTags(modal);
    }
  }, { signal: instance.abortController.signal });

  modal.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.edit-modal__tag-remove');
    if (removeBtn) {
      const idx = parseInt(removeBtn.dataset.tagIndex, 10);
      editModalState.tags.splice(idx, 1);
      renderEditTags(modal);
    }

    const imgRemoveBtn = e.target.closest('.edit-modal__image-remove');
    if (imgRemoveBtn) {
      const existingIdx = imgRemoveBtn.dataset.existingIndex;
      if (existingIdx !== undefined) {
        const exIdx = parseInt(existingIdx, 10);
        editModalState.removedImages.push(editModalState.product.images[exIdx]);
        editModalState.product.images.splice(exIdx, 1);
        renderEditImages(modal);
      } else {
        const newIdx = parseInt(imgRemoveBtn.dataset.newIndex, 10);
        editModalState.newImages.splice(newIdx, 1);
        renderEditImages(modal);
      }
    }
  }, { signal: instance.abortController.signal });

  imageInput.addEventListener('change', () => {
    const files = Array.from(imageInput.files || []);
    const totalImages = (editModalState.product.images?.length || 0) + editModalState.newImages.length + files.length;
    if (totalImages > 5) {
      showToast({ type: 'warning', title: 'Too many images', message: 'Maximum of 5 images allowed.' });
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        editModalState.newImages.push({ file, preview: e.target.result });
        renderEditImages(modal);
      };
      reader.readAsDataURL(file);
    });
    imageInput.value = '';
  }, { signal: instance.abortController.signal });

  altTextBtn.addEventListener('click', () => {
    showToast({ type: 'info', title: 'Alt Text', message: 'Alt text editing will be available soon.' });
  }, { signal: instance.abortController.signal });

  saveBtn.addEventListener('click', async () => {
    const title = modal.querySelector('#editTitle').value.trim();
    const price = modal.querySelector('#editPrice').value;
    const category = modal.querySelector('#editCategory').value;

    if (!title) {
      showToast({ type: 'warning', title: 'Required', message: 'Product title is required.' });
      return;
    }
    if (!price || Number(price) < 0) {
      showToast({ type: 'warning', title: 'Required', message: 'Valid price is required.' });
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', modal.querySelector('#editDescription').value);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('location', modal.querySelector('#editLocation').value);
      formData.append('isAvailable', modal.querySelector('#editAvailability').checked);

      if (editModalState.tags.length > 0) {
        formData.append('tags', JSON.stringify(editModalState.tags));
      }

      const specInputs = modal.querySelectorAll('.edit-modal__spec-input');
      const specs = [];
      specInputs.forEach(input => {
        const key = input.dataset.specKey;
        let value = input.type === 'checkbox' ? input.checked : input.value;
        if (value !== '' && value !== null && value !== undefined) {
          specs.push({ key, value });
        }
      });
      if (specs.length > 0) {
        formData.append('specifications', JSON.stringify(specs));
      }

      editModalState.newImages.forEach(img => {
        formData.append('images', img.file);
      });

      const productId = editModalState.product._id || editModalState.product.id;
      const updateResponse = await updateProduct(productId, formData);
      const updatedProduct = updateResponse.data?.product || updateResponse.data;

      showToast({ type: 'success', title: 'Updated', message: `"${title}" has been updated successfully.` });

      const response = await getAllProducts();
      allProducts = response.data?.products || [];
      filteredProducts = [...allProducts];
      populateFilterOptions();
      renderProducts();

      instance.close();

      openPreviewModal(updatedProduct || editModalState.product);
    } catch (error) {
      console.error('[Products] update error:', error);
      showToast({ type: 'error', title: 'Update failed', message: error.message || 'Could not update product.' });
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  }, { signal: instance.abortController.signal });

  deleteBtn.addEventListener('click', () => {
    const p = editModalState.product;
    const id = p._id || p.id;
    const title = p.title || 'this product';
    instance.close();
    handleDelete(id);
  }, { signal: instance.abortController.signal });
}

function renderEditTags(modal) {
  const container = modal.querySelector('#editTagsContainer');
  const input = modal.querySelector('#editTagInput');
  if (!container || !input) return;

  const tagsHtml = editModalState.tags.map((tag, i) =>
    `<span class="edit-modal__tag">${escapeHtml(tag)}<button type="button" class="edit-modal__tag-remove" data-tag-index="${i}" aria-label="Remove tag">${iconClose({ size: 12 })}</button></span>`
  ).join('');

  container.innerHTML = tagsHtml;
  container.appendChild(input);
  input.placeholder = editModalState.tags.length >= 5 ? 'Max 5 tags' : 'Search or add tags....';
  if (editModalState.tags.length >= 5) input.disabled = true;
  else input.disabled = false;
}

function renderEditImages(modal) {
  const container = modal.querySelector('#editImagesContainer');
  if (!container) return;

  const existingHtml = (editModalState.product.images || []).map((img, i) =>
    `<div class="edit-modal__image-thumb" data-existing-index="${i}"><img src="${img.url}" alt="" /><button type="button" class="edit-modal__image-remove" data-existing-index="${i}" aria-label="Remove image">${iconClose({ size: 12 })}</button></div>`
  ).join('');

  const newHtml = editModalState.newImages.map((img, i) =>
    `<div class="edit-modal__image-thumb" data-new-index="${i}"><img src="${img.preview}" alt="" /><button type="button" class="edit-modal__image-remove" data-new-index="${i}" aria-label="Remove image">${iconClose({ size: 12 })}</button></div>`
  ).join('');

  container.innerHTML = existingHtml + newHtml;
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
        filteredProducts = filteredProducts.filter(p => (p._id || p.id) !== id);
        renderProducts();
      } catch (error) {
        console.error('[Products] delete error:', error);
        showToast({ type: 'error', title: 'Delete failed', message: error.message || 'Could not delete product.' });
      }
    },
  });
}

function formatCurrency(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(num);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    if (diffDay === 1) {
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `Yesterday ${time}`;
    }
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

if (tableSearchInput) {
  let searchTimer = null;
  tableSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 300);
  });
}

if (filterCategory) filterCategory.addEventListener('change', applyFilters);
if (filterAvailability) filterAvailability.addEventListener('change', applyFilters);
if (filterSeller) filterSeller.addEventListener('change', applyFilters);
if (filterLocation) filterLocation.addEventListener('change', applyFilters);

const addProductBtn = document.getElementById('addProductBtn');
if (addProductBtn) {
  addProductBtn.addEventListener('click', () => {
    showToast({ type: 'info', title: 'Coming soon', message: 'Add Product functionality will be available in a future update.' });
  });
}

loadProducts();
