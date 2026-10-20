/* ==========================================================================
   Saved Products page logic (Using Global EasyDealAPI Config)

   Saved state is owned by the server. This page reads it through the shared
   savedService so the Homepage and this page speak to the backend the same
   way, and it reacts to savedSync so a change made on the other page (or in
   another tab) is picked up by re-reading GET /api/saved.
   ========================================================================== */

const CONFIG = {
  PRODUCTS_ENDPOINT: '/products',
  RECOMMENDED_COUNT: 4,
  CURRENCY_PREFIX: '$',
};

/* This file is a classic script (saveProduct.html loads it with a plain
   <script src>), so it cannot use static import statements. The shared
   modules are ES modules, and they are loaded once here through dynamic
   import(). Every entry point awaits `modulesReady` before touching them, so
   a click that arrives before the modules land waits rather than throwing. */
let savedService = null;
let savedSync = null;
let icons = null;
let SESSION_ENDED_EVENT = 'easydeal:session-ended';

const modulesReady = (async () => {
  const [savedMod, syncMod, iconMod, sessionMod] = await Promise.all([
    import('/frontend/shared/services/savedService.js'),
    import('/frontend/shared/services/savedSync.js'),
    import('/frontend/shared/components/icons/icons.js'),
    import('/frontend/shared/components/navbar/navbar.js'),
  ]);
  savedService = savedMod;
  savedSync = syncMod;
  icons = iconMod;
  SESSION_ENDED_EVENT = sessionMod.SESSION_ENDED_EVENT;
})();

const state = {
  saved: [], // raw saved records from GET /api/saved
  recommended: [], // raw products from GET /api/products (filtered)
  savedIds: new Set(), // productId strings currently saved
  search: '',
  sort: 'recent',
  /** productIds with a write in flight, so one click cannot issue two writes. */
  pendingWrites: new Set(),
};

// ---------------------------------------------------------------------------
// Helpers (Updated to use global EasyDealAPI)
// ---------------------------------------------------------------------------

function api(path, options = {}) {
  // Use the global buildUrl and defaultFetchOptions from config.js
  const url = window.EasyDealAPI.buildUrl(path);
  const mergedOptions = {
    ...window.EasyDealAPI.defaultFetchOptions,
    ...options,
  };

  return fetch(url, mergedOptions).then(async (res) => {
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
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/* The heart is rendered from the shared icon library on both this page and the
   Homepage, so the outline and solid glyphs cannot drift apart. The saved state
   swaps to the solid glyph rather than relying on CSS to fill an outline icon:
   `fill="none"` is a presentation attribute on the element, so it wins over an
   inherited value and the fill cannot be forced from a stylesheet. */
function heartButtonHtml(productId, isSaved) {
  if (!icons) return '';
  const glyph = isSaved
    ? icons.iconHeartFilled({ size: 21 })
    : icons.iconHeart({ size: 21 });
  return `
    <button
      class="icon-btn heart-btn ${isSaved ? 'is-saved' : ''}"
      data-product-id="${productId}"
      data-saved="${isSaved}"
      aria-pressed="${isSaved}"
      aria-label="${isSaved ? 'Remove from saved' : 'Save product'}"
      title="${isSaved ? 'Remove from saved' : 'Save product'}"
    >
      ${glyph}
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

async function loadSaved({ quiet = false } = {}) {
  await modulesReady;
  try {
    /* The server is the authority for saved state. This is the single read
       every other path funnels through, including the sync-driven
       re-checks, so no page can end up holding a stale set. */
    const { success, items, message } = await savedService.listSavedItems();

    if (!success) {
      throw new Error(message || 'Request failed');
    }

    state.saved = items;
    state.savedIds = new Set(
      state.saved.filter((r) => r.productId).map((r) => r.productId._id),
    );
    renderSaved();
    renderRecommended();
  } catch (err) {
    if (quiet) {
      /* A background re-check must not blow away a list that is already on
         screen; the next check will pick the change up. */
      console.warn('[Saved Products] re-check failed:', err.message);
      return;
    }
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
  await modulesReady;
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

/* Both writes go through the shared service, then re-read the server rather
   than patching local state. A local edit before the request is what allowed
   this page and the Homepage to disagree about the same product: this page
   dropped the card immediately and rolled back on failure, while the Homepage
   left the heart untouched. Following the server removes that divergence, and
   the duplicate guard below keeps a double click from issuing two writes. */
async function unsaveProduct(productId) {
  await modulesReady;
  if (state.pendingWrites.has(productId)) return;
  state.pendingWrites.add(productId);
  setControlBusy(productId, true);

  try {
    await savedService.unsaveProduct(productId);
    savedSync.notifySavedChanged();
    showToast('Removed from saved products');
  } catch (err) {
    showToast(err.message || 'Could not remove product', true);
  } finally {
    state.pendingWrites.delete(productId);
    setControlBusy(productId, false);
    await loadSaved({ quiet: true });
  }
}

async function saveProduct(productId) {
  await modulesReady;
  if (state.pendingWrites.has(productId)) return;
  state.pendingWrites.add(productId);
  setControlBusy(productId, true);

  try {
    await savedService.saveProduct(productId);
    savedSync.notifySavedChanged();
    showToast('Added to saved products');
  } catch (err) {
    showToast(err.message || 'Could not save product', true);
  } finally {
    state.pendingWrites.delete(productId);
    setControlBusy(productId, false);
    await loadSaved({ quiet: true });
  }
}

/** Disable both controls for a product while its write is in flight. */
function setControlBusy(productId, busy) {
  document
    .querySelectorAll(
      `.heart-btn[data-product-id="${productId}"], .remove-btn[data-product-id="${productId}"]`,
    )
    .forEach((el) => {
      el.disabled = busy;
    });
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

/* A saved product removed here used to stay shown as saved on a Homepage that
   was already open, because that page had read the saved set once and never
   heard about the removal. These subscriptions re-read the server: the signal
   carries no state of its own, so a dropped or spurious ping costs a request
   and never a wrong answer. Registered once the modules are in place. */
let syncSubscribed = false;
async function subscribeToSavedSync() {
  await modulesReady;
  if (syncSubscribed) return;
  syncSubscribed = true;
  savedSync.onSavedChanged(() => loadSaved({ quiet: true }));
  savedSync.onSavedMayBeStale(() => loadSaved({ quiet: true }));
}

/* Sign-out lives in the shared navbar's account menu and does not reload the
   page, so the saved list on screen would keep showing another account's
   items. The shared header announces a confirmed sign-out; drop the state
   rather than leave a stale list behind. */
window.addEventListener(SESSION_ENDED_EVENT, () => {
  state.saved = [];
  state.savedIds = new Set();
  renderSaved();
  renderRecommended();
});

function closeAllMenus() {
  document
    .querySelectorAll('.menu-dropdown.is-open')
    .forEach((m) => m.classList.remove('is-open'));
}

document.addEventListener('click', (e) => {
  const heartBtn = e.target.closest('.heart-btn');
  if (heartBtn) {
    if (heartBtn.disabled) return;
    const productId = heartBtn.dataset.productId;
    const isSaved = heartBtn.dataset.saved === 'true';
    isSaved ? unsaveProduct(productId) : saveProduct(productId);
    return;
  }

  const removeBtn = e.target.closest('.remove-btn');
  if (removeBtn) {
    if (removeBtn.disabled) return;
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
  await modulesReady;
  await subscribeToSavedSync();
  await Promise.allSettled([loadSaved(), loadRecommended()]);
})();
