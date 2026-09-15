/* ==========================================================================
   Saved Products page logic
   ========================================================================== */

const CONFIG = {
  API_BASE: 'http://localhost:3000',
  SAVED_ENDPOINT: '/api/saved',
  PRODUCTS_ENDPOINT: '/api/products',
  RECOMMENDED_COUNT: 4,
  CURRENCY_PREFIX: '$',
};

const state = {
  saved: [], // raw saved records from GET /api/saved
  recommended: [], // raw products from GET /api/products (filtered)
  savedIds: new Set(), // productId strings currently saved
  search: '',
  sort: 'recent',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function api(path, options = {}) {
  return fetch(`${CONFIG.API_BASE}${path}`, {
    credentials: 'include',
    ...options,
  }).then(async (res) => {
    let body = null;
    try {
      body = await res.json();
    } catch (_) {
      /* no body */
    }
    if (!res.ok) {
      const message = body?.message || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return body;
  });
}

function formatPrice(price) {
  if (typeof price !== 'number') return '';
  return `${CONFIG.CURRENCY_PREFIX}${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function getCondition(product) {
  const spec = product?.specifications?.find((s) => s.key === 'condition');
  return spec ? spec.value : null;
}

function getImage(product) {
  return product?.images?.[0]?.url || '';
}

// Updated to read phone directly from populated seller
function getSellerWhatsapp(product) {
  const seller = product?.seller;
  if (seller && typeof seller === 'object') {
    return seller.phone || null;
  }
  return null;
}

function buildWhatsappUrl(number, product) {
  const digits = String(number).replace(/[^\d]/g, '');
  const text = encodeURIComponent(
    `Hi, I'm interested in "${product.title}" listed for ${formatPrice(product.price)}.`,
  );
  return `https://wa.me/${digits}?text=${text}`;
}

function escapeHtml(str = '') {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c],
  );
}

function truncate(str = '', max = 60) {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

let toastTimer = null;
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function heartButtonHtml(productId, isSaved) {
  return `
    <button
      class="icon-btn heart-btn ${isSaved ? 'is-saved' : ''}"
      data-product-id="${productId}"
      data-saved="${isSaved}"
      aria-pressed="${isSaved}"
      aria-label="${isSaved ? 'Remove from saved' : 'Save product'}"
      title="${isSaved ? 'Remove from saved' : 'Save product'}"
    >
      <svg><use href="#icon-heart"></use></svg>
    </button>`;
}

function whatsappButtonHtml(product) {
  const number = getSellerWhatsapp(product);
  if (!number) {
    return `
      <button class="whatsapp-btn is-disabled" disabled title="Seller contact not available">
        <svg><use href="#icon-whatsapp"></use></svg>
        Whatsapp
      </button>`;
  }

  const url = buildWhatsappUrl(number, product);
  return `
    <a class="whatsapp-btn" href="${url}" target="_blank" rel="noopener noreferrer">
      <svg><use href="#icon-whatsapp"></use></svg>
      Whatsapp
    </a>`;
}

function savedCardHtml(record) {
  const product = record.productId;
  if (!product) return '';
  const condition = getCondition(product);
  return `
    <article class="saved-card" data-record-id="${record._id}" data-product-id="${product._id}">
      <div class="saved-card__media">
        <img src="${getImage(product)}" alt="${escapeHtml(product.title)}" loading="lazy" />
      </div>
      <div class="saved-card__body">
        <div class="saved-card__title-row">
          <h3 class="saved-card__title">${escapeHtml(product.title)}</h3>
          <div class="saved-card__right-actions">
            <span class="saved-card__price">${formatPrice(product.price)}</span>
            ${heartButtonHtml(product._id, true)}
            <div class="menu-wrap">
              <button class="icon-btn menu-btn" aria-label="More options" aria-haspopup="true" aria-expanded="false">
                <svg><use href="#icon-more"></use></svg>
              </button>
              <div class="menu-dropdown">
                <button type="button" class="danger remove-btn" data-product-id="${product._id}">Remove from saved</button>
              </div>
            </div>
          </div>
        </div>
        <p class="saved-card__desc">${escapeHtml(truncate(product.description || '', 70))}</p>
        ${condition ? `<p class="saved-card__condition">${escapeHtml(condition)}</p>` : ''}
        <div class="saved-card__footer">
          ${
            product.location
              ? `
            <p class="saved-card__location">
              <svg><use href="#icon-pin"></use></svg>
              ${escapeHtml(product.location)}
            </p>`
              : ''
          }
          ${whatsappButtonHtml(product)}
        </div>
      </div>
    </article>`;
}

function recCardHtml(product) {
  const condition = getCondition(product);
  const isSaved = state.savedIds.has(product._id);
  return `
    <article class="rec-card" data-product-id="${product._id}">
      <div class="rec-card__media">
        <img src="${getImage(product)}" alt="${escapeHtml(product.title)}" loading="lazy" />
      </div>
      <div class="rec-card__body">
        <div class="rec-card__title-row">
          <h3 class="rec-card__title">${escapeHtml(product.title)}</h3>
          <div class="rec-card__right-actions">
            <span class="rec-card__price">${formatPrice(product.price)}</span>
            ${heartButtonHtml(product._id, isSaved)}
          </div>
        </div>
        <p class="rec-card__desc">${escapeHtml(truncate(product.description || '', 48))}</p>
        ${condition ? `<p class="rec-card__condition">${escapeHtml(condition)}</p>` : ''}
        <div class="rec-card__footer">
          ${
            product.location
              ? `
            <p class="rec-card__location">
              <svg><use href="#icon-pin"></use></svg>
              ${escapeHtml(product.location)}
            </p>`
              : ''
          }
          ${whatsappButtonHtml(product)}
        </div>
      </div>
    </article>`;
}

function getFilteredSortedSaved() {
  let list = [...state.saved].filter((r) => r.productId);

  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    list = list.filter((r) => r.productId.title?.toLowerCase().includes(q));
  }

  switch (state.sort) {
    case 'price-asc':
      list.sort((a, b) => (a.productId.price ?? 0) - (b.productId.price ?? 0));
      break;
    case 'price-desc':
      list.sort((a, b) => (b.productId.price ?? 0) - (a.productId.price ?? 0));
      break;
    case 'title-asc':
      list.sort((a, b) =>
        (a.productId.title || '').localeCompare(b.productId.title || ''),
      );
      break;
    default: // 'recent'
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return list;
}

function renderSaved() {
  const list = getFilteredSortedSaved();
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = `${state.saved.length} Saved Product${state.saved.length === 1 ? '' : 's'}`;
  }

  const container = document.getElementById('savedList');
  if (!container) return;

  if (state.saved.length === 0) {
    container.innerHTML = `
      <div class="state-block">
        <strong>No saved products yet</strong>
        Products you save will show up here so you can find them again.
      </div>`;
    return;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="state-block">
        <strong>No matches</strong>
        Try a different search term.
      </div>`;
    return;
  }

  container.innerHTML = list.map(savedCardHtml).join('');
}

function renderRecommended() {
  const container = document.getElementById('recGrid');
  if (!container) return;

  const list = state.recommended.slice(0, CONFIG.RECOMMENDED_COUNT);

  if (list.length === 0) {
    container.innerHTML = `<div class="state-block">No recommendations right now.</div>`;
    return;
  }

  container.innerHTML = list.map(recCardHtml).join('');
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

async function loadSaved() {
  try {
    const res = await api(CONFIG.SAVED_ENDPOINT);
    state.saved = res.data || [];
    state.savedIds = new Set(
      state.saved.filter((r) => r.productId).map((r) => r.productId._id),
    );
    renderSaved();
    renderRecommended();
  } catch (err) {
    const container = document.getElementById('savedList');
    if (container) {
      container.innerHTML = `
        <div class="state-block">
          <strong>Couldn't load saved products</strong>
          ${escapeHtml(err.message)}
        </div>`;
    }
  }
}

async function loadRecommended() {
  try {
    const res = await api(CONFIG.PRODUCTS_ENDPOINT);
    const all = res.data || [];
    state.recommended = all.filter((p) => !state.savedIds.has(p._id));
    renderRecommended();
  } catch (err) {
    const container = document.getElementById('recGrid');
    if (container) {
      container.innerHTML = `
        <div class="state-block">
          <strong>Couldn't load recommendations</strong>
          ${escapeHtml(err.message)}
        </div>`;
    }
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function unsaveProduct(productId) {
  const previous = state.saved;
  state.saved = state.saved.filter((r) => r.productId?._id !== productId);
  state.savedIds.delete(productId);
  renderSaved();
  renderRecommended();

  try {
    await api(`${CONFIG.SAVED_ENDPOINT}/${productId}`, { method: 'DELETE' });
    showToast('Removed from saved products');
  } catch (err) {
    state.saved = previous;
    state.savedIds.add(productId);
    renderSaved();
    renderRecommended();
    showToast(err.message || 'Could not remove product', true);
  }
}

async function saveProduct(productId) {
  state.savedIds.add(productId);
  renderRecommended();

  try {
    await api(`${CONFIG.SAVED_ENDPOINT}/${productId}`, { method: 'POST' });
    showToast('Added to saved products');
    await loadSaved();
  } catch (err) {
    state.savedIds.delete(productId);
    renderRecommended();
    showToast(err.message || 'Could not save product', true);
  }
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

function closeAllMenus() {
  document
    .querySelectorAll('.menu-dropdown.is-open')
    .forEach((m) => m.classList.remove('is-open'));
}

document.addEventListener('click', (e) => {
  const heartBtn = e.target.closest('.heart-btn');
  if (heartBtn) {
    const productId = heartBtn.dataset.productId;
    const isSaved = heartBtn.dataset.saved === 'true';
    isSaved ? unsaveProduct(productId) : saveProduct(productId);
    return;
  }

  const removeBtn = e.target.closest('.remove-btn');
  if (removeBtn) {
    unsaveProduct(removeBtn.dataset.productId);
    closeAllMenus();
    return;
  }

  const menuBtn = e.target.closest('.menu-btn');
  if (menuBtn) {
    const dropdown = menuBtn.parentElement.querySelector('.menu-dropdown');
    const wasOpen = dropdown.classList.contains('is-open');
    closeAllMenus();
    if (!wasOpen) dropdown.classList.add('is-open');
    return;
  }

  closeAllMenus();
});

const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    state.search = e.target.value;
    renderSaved();
  });
}

const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
  sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderSaved();
  });
}

const viewAllLink = document.getElementById('viewAllLink');
if (viewAllLink) {
  viewAllLink.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Hook this up to your full products page');
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

(async function init() {
  await Promise.allSettled([loadSaved(), loadRecommended()]);
})();
