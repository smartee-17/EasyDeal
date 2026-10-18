import {
  getCurrentUser,
} from "../Auth/Services/authService.js";
import {
  consumePendingAction,
  rememberPendingAction,
} from "../Auth/Shared/redirect.js";
import { buildUrl, defaultFetchOptions } from "../shared/apiConfig.js";
import {
  fetchSavedProductIds,
  saveProduct,
  unsaveProduct,
} from "../shared/services/savedService.js";
import {
  notifySavedChanged,
  onSavedChanged,
  onSavedMayBeStale,
} from "../shared/services/savedSync.js";
import { showToast } from "../shared/components/toast/toast.js";
import { SESSION_ENDED_EVENT } from "../shared/components/navbar/navbar.js";
import {
  iconCheck,
  iconChevronLeft,
  iconChevronRight,
  iconGitHub,
  iconHeart,
  iconHeartFilled,
  iconInstagram,
  iconLinkedIn,
  iconSearch,
  iconWhatsApp,
  iconXTwitter,
} from "../shared/components/icons/icons.js";
import { openWA } from "../shared/utils.js";

const productsContainer = document.querySelectorAll(".products");
const categoriesContainer = document.querySelector(".categories-list");
const categoriesScrollContainer = document.querySelector(".categories-scroll");
const leftArrow = document.getElementById("slideLeftBtn");
const rightArrow = document.getElementById("slideRightBtn");
const browseButton = document.querySelector(".browse");
const sellButton = document.querySelector(".Sellitem");

/** Path convention
 *  HTML in this folder uses relative dot paths (see the footer links in
 *  homepage.html). JavaScript navigation uses absolute application paths,
 *  because the served document root is the repository root, so
 *  /frontend/<page> works from any depth. That is why the constants below
 *  carry the /frontend/ segment.
 *
 *  This one must match its entry in ALLOWED_PENDING_DESTINATIONS exactly,
 *  or rememberPendingAction() rejects it and the Saved Items pending
 *  action is silently never stored. */
const SAVED_ITEMS_URL = "/frontend/save-product/saveProduct.html";

let allProductsData = [];
let allCategoriesData = [];

/* ============================================================
   API access

   The base URL and the fetch defaults are declared once, in
   frontend/shared/apiConfig.js, and imported here. Protected
   Saved Items calls go through shared/services/savedService.js,
   which is built on the same module, so no page holds its own copy
   of the host, the fetch options or the envelope handling.

   credentials: 'include' comes from that shared config and is what
   carries the HttpOnly session cookie.
   ============================================================ */

/**
 * Fetch and unwrap a public endpoint.
 *
 * Browsing is deliberately not gated: the backend serves GET /products
 * and GET /categories to guests, so looking at the catalogue needs no
 * session.
 */
async function apiGet(path) {
  const response = await fetch(buildUrl(path), {
    ...defaultFetchOptions,
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()).data;
}

/* ============================================================
   Icons

   Every UI glyph on this page comes from the shared icon library
   (shared/components/icons). The markup carries empty placeholders tagged
   with data-icon, and they are filled here, so the page has exactly one
   icon system and no standalone icon image files.

   The brand marks stay real images: a logo is content, not a UI glyph,
   and the shared library is a stroke-icon set with no equivalent.
   ============================================================ */

const STATIC_ICONS = {
  search: () => iconSearch({ size: 16 }),
  "chevron-left": () => iconChevronLeft({ size: 20 }),
  "chevron-right": () => iconChevronRight({ size: 20 }),
  instagram: () => iconInstagram({ size: 20 }),
  "x-twitter": () => iconXTwitter({ size: 20 }),
  linkedin: () => iconLinkedIn({ size: 20 }),
  github: () => iconGitHub({ size: 20 }),
};

function renderStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach((placeholder) => {
    const build = STATIC_ICONS[placeholder.dataset.icon];
    // Unknown names are left empty rather than rendering a broken glyph.
    if (!build) return;
    // Locally generated markup from the project's own icon library.
    // No user or backend data is involved.
    placeholder.innerHTML = build();
  });
}

/* ============================================================
   Authentication state

   Server-derived, from Stage 4. `session` is the only source of truth
   on this page: there is no second isLoggedIn flag that could drift
   away from the real session. `role` is whatever the backend reported
   and is never inferred locally; it carries no authority of its own,
   only deciding which message a visitor sees. Every protected call is
   still re-checked server-side.
   ============================================================ */

// Root-relative so the paths do not depend on the current directory.
const LOGIN_URL = "/frontend/Auth/Login/login.html";

/** Where a gated action sends the visitor back to. This is a real page
 *  on ALLOWED_PENDING_DESTINATIONS, so rememberPendingAction accepts
 *  it; the value is never derived from user input. */
const HOMEPAGE_URL = "/frontend/Homepage/homepage.html";

const AUTH_STATE = Object.freeze({
  LOADING: "loading",
  ANONYMOUS: "anonymous",
  AUTHENTICATED: "authenticated",
});

/* The Homepage mounts the shared navbar, so it does not own any of the
   header's controls. These lookups are all optional and deliberately kept:
   renderSignedIn()/renderSignedOut() update whatever is present and are
   no-ops otherwise, which keeps those functions honest if the shared header
   is ever the only header on the page. */
const authControls = document.getElementById("authControls");
const loginButton = document.getElementById("headerLogin");
const signupButton = document.getElementById("headerSignup");
const accountPanel = document.getElementById("headerAccount");
const userNameLabel = document.getElementById("headerUserName");
const authNotice = document.getElementById("authNotice");

export const session = {
  state: AUTH_STATE.LOADING,
  user: null,
  role: null,
};

/* ============================================================
   Saved-item state
   ============================================================ */

/** Product ids this session has saved. Server-derived: it comes from
 *  GET /api/saved and is never written by a click that has not been
 *  confirmed by the backend. */
const savedProductIds = new Set();

/** Products with a request in flight, so a card cannot be double
 *  submitted while the first call is still open. */
const pendingSaveRequests = new Set();

function isAuthenticated() {
  return session.state === AUTH_STATE.AUTHENTICATED;
}

/* ── Session rendering ──────────────────────────────────────── */

function setAuthState(state) {
  session.state = state;
  if (authControls) {
    authControls.dataset.authState = state;
  }
}

function showNotice(message) {
  if (!authNotice) return;
  authNotice.textContent = message;
  authNotice.hidden = !message;
}

function displayName(user) {
  if (!user) return "";
  // Prefer a human name; fall back to the generated username. Email is
  // never shown in the header.
  return user.name || user.username || "";
}

function renderSignedOut() {
  if (accountPanel) accountPanel.hidden = true;
  if (loginButton) loginButton.hidden = false;
  if (signupButton) signupButton.hidden = false;
}

function renderSignedIn(user) {
  if (userNameLabel) userNameLabel.textContent = displayName(user);
  if (accountPanel) accountPanel.hidden = false;
  if (loginButton) loginButton.hidden = true;
  if (signupButton) signupButton.hidden = true;
}

/**
 * Drop every trace of the session from protected UI.
 *
 * Called on logout and whenever the backend reports the session is gone.
 * Without this the hearts would keep showing another account's saved
 * state.
 */
function clearProtectedState() {
  savedProductIds.clear();
  pendingSaveRequests.clear();
  applySavedStateToCards();
}

/**
 * Resolve the session once, on load, and render the matching state.
 *
 * The Homepage no longer renders the navbar itself — it mounts the shared
 * header, which owns the Login / Sign up / account dropdown. This function
 * still has to run, because the Homepage needs to know whether the visitor
 * may save a product: the hearts are gated on the session, and the pending
 * save resume fires from here. Skipping it would leave every heart
 * permanently anonymous and silently break saving.
 *
 * The render* calls are therefore best-effort: they update whatever header
 * markup exists and are no-ops when the shared header owns that markup.
 *
 * A 401 is the expected signed-out answer and simply produces the public
 * state. Any other failure is reported rather than silently treated as
 * proof that nobody is signed in.
 */
async function initSession() {
  setAuthState(AUTH_STATE.LOADING);
  showNotice("");

  const { user, success, status, message } = await getCurrentUser();

  if (success && user) {
    session.user = user;
    session.role = user.role ?? null;
    renderSignedIn(user);
    setAuthState(AUTH_STATE.AUTHENTICATED);
    await loadSavedState();
    // Only once the saved set is known, so the resulting heart reflects a
    // server-confirmed state rather than an assumption.
    await resumePendingAction();
    return;
  }

  session.user = null;
  session.role = null;
  savedProductIds.clear();
  renderSignedOut();
  setAuthState(AUTH_STATE.ANONYMOUS);

  // 401 (or 403) means the browser simply has no valid session, which is
  // the normal public Homepage state and needs no message.
  if (status === 401 || status === 403) return;

  showNotice(
    "We could not confirm your session. You are browsing as a guest.",
  );
  if (!success && status !== 0) {
    console.warn("[Homepage] session check failed:", status, message);
  }
}

/**
 * Load which products this session has already saved.
 *
 * The backend has no batch "is this saved?" endpoint, so the caller's
 * whole saved list is fetched once and matched client-side. Anonymous
 * visitors never reach this: there is no point spending a protected
 * request to discover they are signed out.
 */
async function loadSavedState() {
  if (!isAuthenticated()) return;

  const { success, savedIds, status } = await fetchSavedProductIds();

  if (success) {
    savedProductIds.clear();
    for (const id of savedIds) savedProductIds.add(id);
    applySavedStateToCards();
    return;
  }

  // The session can expire between the header check and this call.
  if (status === 401 || status === 403) {
    await handleSessionExpired();
  }
}

/* A product removed on Saved Products used to stay shown as saved here,
   because this page read the saved set once at load and never heard about
   the removal. Both subscriptions re-read the server. The signal carries no
   state, so the server stays the only authority: a spurious ping costs one
   request, and a missed ping is covered by the focus/visibility re-check. */
onSavedChanged(() => loadSavedState());
onSavedMayBeStale(() => loadSavedState());

/* ── Navigation ─────────────────────────────────────────────── */

/* Login and Sign up are plain links inside the shared navbar, so they need no
   handler here. The Homepage's own header markup has been removed and these
   elements no longer exist; the shared header navigates them itself. */

/**
 * Send a visitor to log in, remembering where they were headed.
 *
 * The destination is validated against the application allowlist in
 * Auth/Shared/redirect.js before it is stored, and validated again when
 * it is read. A hostile value can therefore neither be planted by this
 * function nor honoured if it is written to sessionStorage directly.
 *
 * `action` optionally carries the protected thing that was attempted, so
 * the flow can be resumed rather than merely returning the visitor to
 * this page. Only the closed action types and a bare product id are
 * accepted by that module; nothing here is followed as a URL.
 *
 * @param {string} [returnTo] an approved application destination
 * @param {{type: string, productId: string}} [action] protected action to resume
 */
export function requireLogin(returnTo = HOMEPAGE_URL, action = null) {
  const stored = action
    ? rememberPendingAction({ type: action.type, destination: returnTo, productId: action.productId })
    : rememberPendingAction(returnTo);

  // Storage can be unavailable (private browsing, blocked partition). The
  // visitor still reaches Login and comes back here; only the resume is
  // lost, and losing it must never be reported as success.
  if (!stored) {
    console.warn("[Homepage] pending action could not be stored; the action will not resume.");
  }

  window.location.href = LOGIN_URL;
}

/* ── Logout ─────────────────────────────────────────────────── */

/* The Homepage has no logout control of its own: sign-out lives in the shared
   navbar's account menu, which confirms through the same dialog this page
   used to open and only navigates away from state once the backend has
   cleared the cookie.

   The one thing this page must still do is drop the authenticated-only state
   it holds. Signing out from the navbar does not reload the page, so without
   the listener below the hearts would keep showing another account's saved
   items and the account panel would stay open. The shared header announces a
   confirmed sign-out on the window; see SESSION_ENDED_EVENT in
   header-session.js. */
window.addEventListener(SESSION_ENDED_EVENT, () => {
  session.user = null;
  session.role = null;
  clearProtectedState();
  renderSignedOut();
  setAuthState(AUTH_STATE.ANONYMOUS);
});

/**
 * React to the backend reporting the session is no longer valid.
 *
 * This is the mid-session expiry case: the page was loaded
 * authenticated, the cookie has since expired, and a protected action
 * answered 401. The session is downgraded to anonymous, every saved
 * marker is cleared so the UI cannot keep claiming another account's
 * state, and the visitor is told plainly rather than being left with a
 * silently broken control.
 */
async function handleSessionExpired() {
  session.user = null;
  session.role = null;
  clearProtectedState();
  renderSignedOut();
  setAuthState(AUTH_STATE.ANONYMOUS);

  showToast({
    type: "warning",
    title: "Session expired",
    message: "Please log in again to save items.",
  });
}

/* ============================================================
   Catalogue rendering

   Cards are built with DOM APIs and textContent rather than by
   interpolating product data into innerHTML. Product titles,
   descriptions and prices are seller-supplied, and the previous
   innerHTML template wrote them straight into markup. Only the
   project's own icon markup, which is generated locally and contains
   no product data, is assigned as HTML.
   ============================================================ */

async function fetchData() {
  try {
    allProductsData = await apiGet("/products");

    await renderCategories();

    if (productsContainer.length > 0) {
      refreshProducts();
      applySavedStateToCards();
    }
  } catch (error) {
    console.error("Fetch failed:", error);
    if (productsContainer.length > 0) {
      productsContainer.forEach((container) => {
        container.replaceChildren(
          Object.assign(document.createElement("p"), {
            textContent: "Error loading products.",
          }),
        );
      });
    }
  }
}

async function renderCategories() {
  if (!categoriesContainer) return;

  try {
    const data = await apiGet("/categories");

    const categoryLabels = data
      .map((item) => item.label || item.name || item)
      .filter(Boolean);

    const categories = ["All Products", ...new Set(categoryLabels)];
    allCategoriesData = categories;

    categoriesContainer.replaceChildren(
      ...categories.map((cat) => {
        const item = document.createElement("li");
        item.className = "category-bar__item";

        const button = document.createElement("button");
        button.className = "category-bar__item-btn";
        button.type = "button";
        button.textContent = cat;
        if (cat === "All Products") button.classList.add("active");

        item.append(button);
        return item;
      }),
    );

    categoriesContainer.addEventListener("click", (e) => {
      const clickedBtn = e.target.closest(".category-bar__item-btn");
      if (!clickedBtn) return;

      categoriesContainer
        .querySelectorAll(".category-bar__item-btn")
        .forEach((btn) => btn.classList.remove("active"));

      clickedBtn.classList.add("active");

      // A category click narrows the browse; with an active search the two
      // filters combine rather than one replacing the other.
      activeCategory = clickedBtn.textContent.trim();
      refreshProducts();
    });
  } catch (error) {
    console.error("Failed to render categories:", error);
  }
}

function productCategoryLabel(product) {
  return (
    product.label ||
    product.category?.label ||
    product.category?.name ||
    product.category ||
    ""
  );
}

/** The number a WhatsApp chat should open with, taken from the seller
 *  the backend already returned. Never invented. */
function sellerContact(product) {
  const seller = product.seller;
  if (!seller || typeof seller !== "object") return "";
  return seller.whatsappNumber || seller.phone || "";
}

function buildHeartButton(product) {
  const title = String(product.title ?? "this product");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "product-card_heart";
  button.dataset.productId = product._id;
  button.dataset.saved = "false";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", `Save ${title} to your saved items`);
  // Local, generated icon markup. No product data is interpolated here.
  button.innerHTML = iconHeart({ size: 21 });

  return button;
}

function buildWhatsAppButton(product) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "product-card__button";

  const contact = sellerContact(product);
  const title = product.title ? String(product.title) : "";

  if (!contact) {
    // No contact on the listing: say so instead of opening a chat with a
    // number that does not exist.
    button.disabled = true;
    button.classList.add("is-unavailable");
    button.setAttribute(
      "aria-label",
      `WhatsApp contact unavailable${title ? ` for ${title}` : ""}`,
    );
    button.textContent = "WhatsApp";
    return button;
  }

  button.dataset.contact = contact;
  button.setAttribute(
    "aria-label",
    `Contact the seller on WhatsApp about ${title || "this product"}`,
  );

  const icon = document.createElement("span");
  icon.className = "product-card__button-icon";
  icon.setAttribute("aria-hidden", "true");
  // Local, generated icon markup. No product data is interpolated here.
  icon.innerHTML = iconWhatsApp({ size: 25 });
  button.append(icon);

  // The visible label stays short so the fixed-width button cannot be
  // pushed around by a long product title; the detail lives in the
  // accessible name above.
  button.append(document.createTextNode("WhatsApp"));

  return button;
}

function buildProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.productId = product._id;

  const imageWrap = document.createElement("div");
  imageWrap.className = "product-card-img__container";

  const image = document.createElement("img");
  image.className = "product-card__image";
  image.loading = "lazy";
  const imageUrl = product.images?.[0]?.url;
  if (imageUrl) image.src = imageUrl;
  image.alt = product.images?.[0]?.alt || product.title || "Product image";

  const verified = document.createElement("span");
  verified.className = "product-card_greentick";
  verified.setAttribute("aria-hidden", "true");
  // Shared icon library: the "verified" tick. Green is a colour
  // reinforcement only; the position and shape carry the meaning.
  verified.innerHTML = iconCheck({ size: 18 });

  imageWrap.append(image, verified, buildHeartButton(product));

  const info = document.createElement("div");
  info.className = "card-info";

  const heading = document.createElement("div");
  heading.className = "pt";
  const title = document.createElement("h3");
  title.className = "product-card__title";
  title.textContent = product.title ?? "";
  const price = document.createElement("p");
  price.className = "product-card__price";
  price.textContent =
    product.price === null || product.price === undefined
      ? ""
      : `$${Number(product.price).toLocaleString("en-US", {
          maximumFractionDigits: 0,
        })}`;
  heading.append(title, price);

  const description = document.createElement("p");
  description.className = "product-card_description";
  description.textContent = product.description ?? "";

  info.append(heading, description, buildWhatsAppButton(product));
  card.append(imageWrap, info);

  return card;
}

/* ============================================================
   Product search

   Where the term comes from
   The shared navbar search and the Homepage's own search field both
   submit to this page as ?q=<term>, so a result set is shareable and
   survives a reload.

   How the term is applied
   The public product endpoint, GET /api/products, takes only category,
   minPrice, maxPrice, condition, location and owner. There is no
   text-search parameter on it and no /products/search route on the
   public router, so there is no server-side text search to call. The
   match is therefore made here, in the browser, against the real
   catalogue the backend returned for this page load. No product is ever
   invented, and no result is claimed to come from a server-side search.

   This is the honest option given the current backend contract. Widening
   GET /api/products with a search parameter would be a backend change,
   which this correction deliberately avoids.
   ============================================================ */

/** The query parameter carrying the search term. */
const SEARCH_PARAM = "q";

/** The active search term, or "" when browsing normally. */
let searchTerm = "";
/** The category the visitor has clicked, or the default. */
let activeCategory = "All Products";
/** Cards shown per grid when browsing normally. Search shows all
 *  matches, because hiding half a result set would be misleading. */
const BROWSE_LIMIT = 4;
const SEARCH_LIMIT = 24;

/** The term in the URL, trimmed. Empty when absent. */
function readSearchTerm() {
  try {
    return (new URLSearchParams(window.location.search).get(SEARCH_PARAM) ?? "")
      .trim();
  } catch {
    return "";
  }
}

/** Fields a buyer would plausibly search by. All are real fields the
 *  listing endpoint returns. */
function matchesTerm(product, term) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    product.title,
    product.description,
    productCategoryLabel(product),
    product.location,
    product.seller?.name,
  ];

  return haystack.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(needle),
  );
}

/** The search status line, created once and reused. */
let searchStatus = null;

function ensureSearchStatus() {
  if (searchStatus && searchStatus.isConnected) return searchStatus;
  const host = document.querySelector(".cards");
  if (!host) return null;

  searchStatus = document.createElement("p");
  searchStatus.className = "search-status";
  searchStatus.setAttribute("role", "status");
  host.parentElement?.insertBefore(searchStatus, host);
  return searchStatus;
}

function updateSearchStatus(count) {
  const status = ensureSearchStatus();
  if (!status) return;

  if (!searchTerm) {
    status.hidden = true;
    status.textContent = "";
    return;
  }

  status.hidden = false;
  status.textContent =
    count === 0
      ? `No products match “${searchTerm}”.`
      : `${count} ${count === 1 ? "product matches" : "products match"} “${searchTerm}”.`;
}

function showGridEmptyState(container, message) {
  container.replaceChildren(
    Object.assign(document.createElement("p"), {
      className: "products__empty",
      textContent: message,
    }),
  );
}

function renderProducts() {
  if (productsContainer.length === 0) return;

  const targetCategory = String(activeCategory).trim().toLowerCase();

  const byCategory =
    activeCategory === "All Products"
      ? allProductsData
      : allProductsData.filter(
          (product) =>
            productCategoryLabel(product).toString().trim().toLowerCase() ===
            targetCategory,
        );

  const matched = byCategory.filter((product) =>
    matchesTerm(product, searchTerm),
  );

  const limit = searchTerm ? SEARCH_LIMIT : BROWSE_LIMIT;
  const display = matched.slice(0, limit);

  // Searching answers in the first grid only. Repeating one result set
  // across three identical grids, as the browsing layout does, would
  // read as three different sets of results.
  const gridsToFill = searchTerm ? 1 : productsContainer.length;

  productsContainer.forEach((container, index) => {
    if (index >= gridsToFill) {
      container.replaceChildren();
      return;
    }

    if (display.length === 0) {
      showGridEmptyState(
        container,
        searchTerm
          ? "Try a different search term."
          : "No products in this category yet.",
      );
      return;
    }

    container.replaceChildren(
      ...display.map((product) => buildProductCard(product)),
    );
  });

  updateSearchStatus(matched.length);
}

/** Re-apply the current category and search term. */
function refreshProducts() {
  renderProducts();
  applySavedStateToCards();
}

/** Read ?q= into state.
 *
 *  The search field itself belongs to the shared navbar now, and
 *  header-session.js reflects ?q= back into that field on load, so this
 *  function only has to put the term into the state the product list is
 *  filtered from. */
function initSearchFromLocation() {
  searchTerm = readSearchTerm();
}

/* ============================================================
   Saved items

   The rule this section exists to enforce: the frontend never claims an
   authenticated action succeeded unless the backend confirmed it. The
   heart is therefore updated from the server's answer, never from the
   click, and a failed call leaves the previous state exactly as it was.
   ============================================================ */

/* ============================================================
   Pending action resume

   A gated save records both where the visitor was and what they were
   trying to do. After login the session lands back here, and this is the
   only place that acts on it.

   Two rules govern this section:
     - the record is consumed exactly once, on read, so a stale action
       cannot re-fire on a later page load or trap anyone in a loop
     - nothing is marked saved until the backend says so. The resume
       issues the same protected request a click would, and reports
       whatever the server answered
   ============================================================ */

/**
 * Perform the protected action recorded before the visitor was sent to log
 * in, if there is one and this page is the place to perform it.
 *
 * Runs after the saved set has loaded, so the resulting heart reflects a
 * server-confirmed state rather than an assumption.
 */
async function resumePendingAction() {
  // Consumed unconditionally: an action this page cannot act on must not
  // linger to fire somewhere unexpected later.
  const record = consumePendingAction();

  if (!record) return;

  // A record for another page is not ours to run.
  const here = new URL(HOMEPAGE_URL, window.location.origin).pathname;
  if (record.destination.toLowerCase() !== here.toLowerCase()) return;

  if (record.type !== 'save-product' || !record.productId) {
    // Nothing to resume; the visitor simply stays on the Homepage.
    return;
  }

  if (pendingSaveRequests.has(record.productId)) return;

  pendingSaveRequests.add(record.productId);
  setHeartBusy(record.productId, true);

  const result = await saveProduct(record.productId);

  pendingSaveRequests.delete(record.productId);
  setHeartBusy(record.productId, false);

  if (result.success) {
    // The backend confirmed it. saveProduct is idempotent server-side, so
    // an already-saved product simply reconfirms rather than duplicating.
    savedProductIds.add(record.productId);
    applySavedStateToCards();
    showToast({
      type: "success",
      title: "Saved",
      message: "Item saved.",
    });
    return;
  }

  if (result.status === 401 || result.status === 403) {
    await handleSessionExpired();
    return;
  }

  // Failed or unreachable. The previous state stands untouched, and the
  // visitor is told rather than shown a saved state that is not real.
  applySavedStateToCards();
  showSavedError("Not saved");
}

/** Reflect the known saved set onto every heart currently on the page. */
function applySavedStateToCards() {
  document
    .querySelectorAll(".product-card_heart[data-product-id]")
    .forEach((button) => {
      const saved = savedProductIds.has(button.dataset.productId);
      button.dataset.saved = saved ? "true" : "false";
      button.setAttribute("aria-pressed", saved ? "true" : "false");
      button.classList.toggle("is-saved", saved);

      /* The saved state swaps in the shared solid glyph rather than asking CSS
         to fill the outline icon. `fill="none"` is a presentation attribute on
         the element, so it outranks an inherited value and the fill cannot be
         forced from a stylesheet; using the solid icon keeps the saved state
         visible even where that rule does not apply. */
      button.innerHTML = saved
        ? iconHeartFilled({ size: 21 })
        : iconHeart({ size: 21 });

      const title = button
        .closest(".product-card")
        ?.querySelector(".product-card__title")?.textContent?.trim();

      const action = saved
        ? `Remove ${title || "this product"} from your saved items`
        : `Save ${title || "this product"} to your saved items`;

      button.setAttribute("aria-label", action);
      button.title = action;

      // A request already in flight owns this button: it stays disabled
      // until that call reports back.
      if (pendingSaveRequests.has(button.dataset.productId)) return;

      button.disabled = false;
      button.removeAttribute("aria-busy");
    });
}

function setHeartBusy(productId, busy) {
  document
    .querySelectorAll(`.product-card_heart[data-product-id="${productId}"]`)
    .forEach((button) => {
      button.disabled = busy;
      if (busy) {
        button.setAttribute("aria-busy", "true");
      } else {
        button.removeAttribute("aria-busy");
      }
    });
}

function showSavedError(title) {
  showToast({
    type: "error",
    title,
    message: "We couldn't update your saved items. Please try again.",
  });
}

/**
 * Save or unsave one product, then follow the backend.
 *
 * The order matters: the request goes first and the UI is updated from
 * the result. A rejected call leaves the heart untouched, so the page
 * can never show "saved" for something the server refused.
 */
async function toggleSaved(productId) {
  if (pendingSaveRequests.has(productId)) return;

  const wasSaved = savedProductIds.has(productId);
  pendingSaveRequests.add(productId);
  setHeartBusy(productId, true);

  const result = wasSaved
    ? await unsaveProduct(productId)
    : await saveProduct(productId);

  pendingSaveRequests.delete(productId);
  setHeartBusy(productId, false);

  if (!result.success) {
    // 401: the session expired between page load and this click.
    if (result.status === 401 || result.status === 403) {
      await handleSessionExpired();
      return;
    }

    if (result.status === 404) {
      // The resource is gone. Do not leave a permanent saved marker.
      savedProductIds.delete(productId);
      applySavedStateToCards();
      showToast({
        type: "error",
        title: "Not available",
        message: "That item is no longer available.",
      });
      return;
    }

    // Network or server fault, or a rejected request: state unchanged.
    applySavedStateToCards();
    showSavedError(wasSaved ? "Not removed" : "Not saved");
    return;
  }

  // Confirmed by the backend. Both save and unsave are idempotent
  // server-side, so this is the authoritative answer either way.
  if (wasSaved) {
    savedProductIds.delete(productId);
  } else {
    savedProductIds.add(productId);
  }
  applySavedStateToCards();

  // Let any other open page/tab know that the server's saved state moved, so
  // a Saved Products page left open in another tab does not keep showing the
  // old state until it is reloaded.
  notifySavedChanged();

  showToast({
    type: "success",
    title: wasSaved ? "Removed" : "Saved",
    message: wasSaved
      ? "Item removed from saved items."
      : "Item saved.",
  });
}

/** One delegated listener for every heart on the page, so a card is
 *  never given its own copy of this logic. */
function bindCardEvents() {
  document.addEventListener("click", (event) => {
    const heart = event.target.closest(".product-card_heart[data-product-id]");
    if (heart) {
      event.preventDefault();
      const productId = heart.dataset.productId;
      if (!productId) return;

      if (!isAuthenticated()) {
        // Do not spend a protected request to learn that nobody is
        // signed in. The known session state answers it. The product id
        // is passed so the save can be resumed after login, not just the
        // navigation; nothing about it is treated as a URL.
        promptLogin("Please log in to save items.", {
          type: "save-product",
          productId,
        });
        return;
      }

      toggleSaved(productId);
      return;
    }

    const whatsapp = event.target.closest(
      ".product-card__button[data-contact]",
    );
    if (whatsapp && !whatsapp.disabled) {
      event.preventDefault();
      const title = whatsapp
        .closest(".product-card")
        ?.querySelector(".product-card__title")?.textContent?.trim();
      openWA(whatsapp.dataset.contact, `Hi, I'm interested in "${title}".`);
    }
  });
}

/* ============================================================
   Hero and footer actions

   Browse stays public: the backend serves the product list to guests,
   so it must not be turned into a gated action.

   Saved Items leads to an existing page that reads the protected
   /api/saved endpoint, so it is gated even though the page exists.

   Sell is gated too, but only as far as the existing application
   actually goes. There is no seller product-creation page in this
   frontend yet, so the action stops at the authentication and role
   boundary rather than inventing a destination.
   ============================================================ */

/** Share the one gate every anonymous protected action uses, so the
 *  wording stays consistent across the header, cards and footer. */
function promptLogin(message, action = null) {
  showToast({
    type: "info",
    title: "Log in required",
    message,
  });
  requireLogin(HOMEPAGE_URL, action);
}

/** What to say once someone is signed in but lacks seller rights, or
 *  has them and still has nowhere to go. */
function showSellOutcome() {
  if (session.role === "seller") {
    // The seller creation flow does not exist in this frontend yet. The
    // boundary is correct and the destination genuinely missing, so no
    // request is sent and no page is invented here.
    showToast({
      type: "info",
      title: "Coming soon",
      message: "The seller listing form isn't available yet.",
    });
    return;
  }

  // A Buyer holds no seller privileges. This message is for experience
  // only: the frontend check authorises nothing, and the backend remains
  // the only thing that can accept or refuse a creation request.
  showToast({
    type: "warning",
    title: "Seller account required",
    message: "You don't have permission to sell products.",
  });
}

browseButton?.addEventListener("click", () => {
  // Browsing needs no session. Bring the catalogue into view rather than
  // sending the visitor somewhere that does not exist yet.
  document
    .querySelector(".cards")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
});

sellButton?.addEventListener("click", () => {
  if (!isAuthenticated()) {
    promptLogin("Please log in to sell an item.");
    return;
  }

  showSellOutcome();
});

/**
 * Gate an anchor whose target exists but needs a session.
 *
 * Signed-in visitors follow the link normally. Anonymous ones are sent to
 * Login with the link's own destination recorded, because that is where
 * they were actually headed.
 */
function gateFooterLink(event, message, destination) {
  if (isAuthenticated()) return;

  event.preventDefault();
  showToast({ type: "info", title: "Log in required", message });
  requireLogin(destination);
}

/**
 * Protect the footer's Saved Products link.
 *
 * The footer is now the shared fragment, injected after this module runs,
 * so the link cannot be captured by an element reference at start-up.
 * Delegating on the document keeps the protection working regardless of
 * when the fragment arrives, and keeps the same protection the Homepage's
 * previous inline footer had.
 */
document.addEventListener("click", (event) => {
  const link = event.target.closest('footer a[href*="saveProduct.html"]');
  if (!link) return;

  gateFooterLink(
    event,
    "Please log in to see your saved items.",
    SAVED_ITEMS_URL,
  );
});

/* ============================================================
   Start-up
   ============================================================ */

renderStaticIcons();
initSearchFromLocation();
fetchData();
bindCardEvents();
leftArrow?.addEventListener("click", () => {
  if (categoriesScrollContainer) {
    categoriesScrollContainer.scrollBy({ left: -220, behavior: "smooth" });
  } else if (categoriesContainer) {
    categoriesContainer.scrollBy({ left: -220, behavior: "smooth" });
  }
});

rightArrow?.addEventListener("click", () => {
  if (categoriesScrollContainer) {
    categoriesScrollContainer.scrollBy({ left: 220, behavior: "smooth" });
  } else if (categoriesContainer) {
    categoriesContainer.scrollBy({ left: 220, behavior: "smooth" });
  }
});

initSession();
