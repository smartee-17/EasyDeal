/* ============================================================
   EASYDEAL - UNIVERSAL NAVBAR (JavaScript component)

   Builds and mounts the one navbar every public page uses, then wires the
   session, the role-aware account menu, logout and product search.

   The markup used to be fetched and injected, which made rendering depend
   on a network round-trip racing the page's own scripts. Building it here
   means it is present in the same tick as the script: complete or absent.

   Elements are created with createElement and filled with textContent. The
   only innerHTML is the shared icon library's own static markup.

   Usage:
     import { mountNavbar } from '../shared/components/navbar/navbar.js';
     mountNavbar(document.querySelector('[data-component=header]'));
   ============================================================ */
import { getCurrentUser, logout } from '../../../Auth/Services/authService.js';
import { iconChevronDown, iconSearch, iconUser } from '../icons/icons.js';
import { attachAccountMenu, renderMenu } from './account-menu.js';
import { confirmLogout } from '../modal/modal.js';
import { showToast } from '../toast/toast.js';
import { initTheme, mountThemeToggle } from '../../services/theme.js';

/** Where the search is answered. See resolveSearchHref() for why. */
export const HOMEPAGE_URL = '/frontend/Homepage/homepage.html';

/** Dispatched on `window` after the backend has confirmed a sign-out.
 *
 *  The navbar owns the sign-out control, but other pages hold
 *  authenticated-only state that signing out invalidates. This event tells
 *  them to clear it. It carries no data and carries no authority: it is only
 *  fired on a confirmed server response, and listeners re-derive what they
 *  need from their own state. */
export const SESSION_ENDED_EVENT = 'easydeal:session-ended';

const AUTH_STATE = Object.freeze({
  LOADING: 'loading',
  ANONYMOUS: 'anonymous',
  AUTHENTICATED: 'authenticated',
});

/* Marks a container whose navbar has been mounted, so a second call is a
   no-op instead of a duplicate. A dataset key is camelCase; it reaches the
   DOM as the data-navbar-mounted attribute. */
const MOUNTED_FLAG = 'navbarMounted';

/* ── View ────────────────────────────────────────────────────────── */

/** Builds one element with attributes and children in a single place. */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child) node.append(child);
  }
  return node;
}

/** An icon slot.
 *
 *  `className` is the selector navbar.css already sizes. The submit button's
 *  glyph deliberately passes an empty string because its box is sized
 *  through `.header__search-submit svg` instead.
 *
 *  The shared library returns its own static markup, so this is the one
 *  place innerHTML is used, and it never carries user data. */
function iconSlot(className, build) {
  const slot = el('span', { class: className || undefined, 'aria-hidden': 'true' });
  slot.innerHTML = build();
  return slot;
}

/**
 * Build a complete navbar element.
 * @returns {HTMLElement} a detached <header class="header">
 */
export function createNavbar() {
  const logo = el('a', { class: 'header__logo', href: HOMEPAGE_URL }, [
    el('span', { class: 'header__logo-icon' }, [
      // The brand mark is a real image file, not a stroke icon, so it loads
      // as an image rather than being inlined.
      el('img', { src: '/frontend/assets/images/logos/icon-light.svg', alt: '', 'aria-hidden': 'true' }),
    ]),
    el('span', { class: 'header__logo-text' }, [
      document.createTextNode('Easy'),
      el('span', { class: 'header__logo-deal', text: 'Deal' }),
    ]),
  ]);

  /* A real <form>, so Enter submits natively on every browser and the
     control is reachable without JavaScript. The action is resolved by
     initSearch(); the method="get" default is deliberate so a submit
     without this module still produces a usable ?q= URL. */
  const searchForm = el('form', {
    class: 'header__search',
    id: 'headerSearchForm',
    role: 'search',
  }, [
    iconSlot('header__search-icon', () => iconSearch({ size: 16 })),
    el('input', {
      type: 'search',
      class: 'header__search-input',
      id: 'headerSearchInput',
      name: 'q',
      placeholder: 'Search products',
      'aria-label': 'Search products',
      autocomplete: 'off',
    }),
    el('button', { type: 'submit', class: 'header__search-submit' }, [
      el('span', { class: 'visually-hidden', text: 'Search' }),
      iconSlot('', () => iconSearch({ size: 16 })),
    ]),
  ]);

  /* Theme toggle. Sits after the search control and before the auth
     actions, so it stays near the right-hand end without displacing the
     account dropdown on narrow screens. */
  const themeToggle = el('button', {
    class: 'header__theme-toggle',
    'data-theme-toggle': true,
    'aria-label': 'Switch to dark theme',
  });

  const actions = el('div', {
    class: 'header__actions',
    id: 'headerActions',
    'data-auth-state': AUTH_STATE.LOADING,
  }, [
    /* Signed out */
    el('a', { class: 'header__login', id: 'headerLogin', href: '/frontend/Auth/Login/login.html', text: 'Login' }),
    el('a', { class: 'header__signup', id: 'headerSignup', href: '/frontend/Auth/Signup/signup.html', text: 'Sign up' }),

    /* Signed in. The username dropdown is the navigation hub, so it is the
       only control: a real <button> carrying aria-expanded and
       aria-controls. */
    el('div', { class: 'header__account', id: 'headerAccount', hidden: true }, [
      el('button', {
        class: 'header__account-trigger',
        id: 'headerAccountTrigger',
        type: 'button',
        'aria-expanded': 'false',
        'aria-controls': 'accountMenu',
        'aria-haspopup': 'true',
      }, [
        iconSlot('header__avatar', () => iconUser({ size: 15 })),
        el('span', { class: 'header__account-name', id: 'headerAccountName' }),
        iconSlot('header__account-chevron', () => iconChevronDown({ size: 14 })),
      ]),

      /* Populated by account-menu.js from the authenticated user's role.
         Nothing is hardcoded here, so a group the visitor may not use is
         never rendered. */
      el('div', {
        class: 'header__menu',
        id: 'accountMenu',
        role: 'menu',
        'aria-labelledby': 'headerAccountTrigger',
        hidden: true,
      }),
    ]),
  ]);

  return el('header', { class: 'header' }, [
    el('div', { class: 'header__inner' }, [logo, searchForm, themeToggle, actions]),
  ]);
}

/* ── Mounting ────────────────────────────────────────────────────── */

/**
 * Mount the navbar into a container, exactly once.
 *
 * A second call returns the navbar already in place rather than adding a
 * second one, so importing this module from more than one script cannot
 * produce two navbars or two sets of listeners.
 *
 * @param {Element} container
 * @returns {HTMLElement|null} the mounted navbar, or null if no container
 */
export function mountNavbar(container) {
  if (!container) {
    console.error(
      '[Navbar] mountNavbar() called without a container. Add a ' +
        '<div data-component="header"></div> mount point to the page.',
    );
    return null;
  }

  if (container.dataset[MOUNTED_FLAG] === 'true') {
    return container.querySelector('.header');
  }

  const navbar = createNavbar();
  container.replaceChildren(navbar);
  container.dataset[MOUNTED_FLAG] = 'true';

  // Session and search are wired after the markup exists, so nothing has to
  // wait on the DOM and no observer can miss the insertion.
  initNavbarSession(navbar);

  return navbar;
}

/* ── Search ───────────────────────────────────────────────────────

   Where results are shown, and why here

   The backend's public product endpoint, GET /api/products, accepts only
   category, minPrice, maxPrice, condition, location and owner. It has no
   text-search parameter, and there is no /products/search route on the
   public router. So the search term is applied against the real catalogue
   the Homepage already loads, and the term travels in the URL as ?q= so
   the result set is shareable and survives a reload.

   This is honest about the backend: the filtering happens in the browser
   over genuinely server-returned products, not by a server-side search
   that does not exist. Nothing here fabricates a result.
   ------------------------------------------------------------------ */

/**
 * Build the search destination for a term.
 *
 * @param {string} term
 * @returns {string} an absolute application path with an encoded query
 */
export function resolveSearchHref(term) {
  const trimmed = (term ?? '').trim();

  // An empty search is a request to clear the filter, not to search. It
  // still goes to the Homepage, just without a query string.
  if (!trimmed) return HOMEPAGE_URL;

  // encodeURIComponent covers the whole value, so spaces, ampersands and
  // anything else cannot break out of the parameter.
  return `${HOMEPAGE_URL}?q=${encodeURIComponent(trimmed)}`;
}

function initSearch(header) {
  const form = header.querySelector('#headerSearchForm');
  const input = header.querySelector('#headerSearchInput');
  if (!form || !input) return;

  // Reflect an existing ?q= back into the field, so a reload or a shared
  // link shows the term that produced the results on screen.
  try {
    const existing = new URLSearchParams(window.location.search).get('q');
    if (existing) input.value = existing;
  } catch {
    // A malformed query string is not worth failing over.
  }

  form.addEventListener('submit', (event) => {
    // Never let the form perform a native GET: the application uses
    // absolute application paths, which a relative form action cannot
    // produce reliably from every host page depth.
    event.preventDefault();

    const term = input.value.trim();

    // Already showing these results: nothing to re-request, and no
    // pointless history entry.
    if (term && new URLSearchParams(window.location.search).get('q') === term) {
      return;
    }

    window.location.href = resolveSearchHref(term);
  });
}

/* ── Session ────────────────────────────────────────────────────── */

function setState(actions, state) {
  actions.dataset.authState = state;
}

/** Prefer a human name; fall back to the generated username. Email is
 *  never displayed in the navbar. */
function displayName(user) {
  if (!user) return '';
  return user.name || user.username || '';
}

function renderSignedOut(elements) {
  elements.account.hidden = true;
  elements.login.hidden = false;
  elements.signup.hidden = false;
}

function renderSignedIn(elements, user) {
  elements.name.textContent = displayName(user);
  elements.account.hidden = false;
  elements.login.hidden = true;
  elements.signup.hidden = true;
}

/**
 * Resolve the session and wire the navbar's interactive behaviour.
 *
 * Called by mountNavbar() once the markup exists. Exported so a caller that
 * needs to re-run it can, but pages do not normally call it.
 *
 * @param {HTMLElement} header
 */
export function initNavbarSession(header) {
  const elements = {
    actions: header.querySelector('#headerActions'),
    login: header.querySelector('#headerLogin'),
    signup: header.querySelector('#headerSignup'),
    account: header.querySelector('#headerAccount'),
    name: header.querySelector('#headerAccountName'),
    trigger: header.querySelector('#headerAccountTrigger'),
    menu: header.querySelector('#accountMenu'),
  };

  // Every control the render functions touch must exist, otherwise the
  // navbar would be left showing a fixed signed-out state and quietly claim
  // nobody is signed in. Report loudly rather than half-render.
  const required = ['actions', 'login', 'signup', 'account', 'name', 'trigger', 'menu'];
  const missing = required.filter((key) => !elements[key]);
  if (missing.length > 0) {
    console.error(`[Navbar] markup is incomplete, missing: ${missing.join(', ')}`);
    return;
  }

  initSearch(header);

  /* Resolve the theme before anything paints, using the same shared contract
     as the Admin app and the Auth pages. Without this a page that mounts the
     navbar had no data-theme at all, so its toggle could switch the theme but
     nothing had chosen an initial one. */
  initTheme();
  mountThemeToggle(header.querySelector('[data-theme-toggle]'));

  /* ── Identity ──────────────────────────────────────────────── */

  // Start hidden: every control set is concealed until the server has
  // answered, so a signed-in visitor never sees "Login" first.
  setState(elements.actions, AUTH_STATE.LOADING);

  getCurrentUser()
    .then(({ success, user: currentUser, status }) => {
      if (success && currentUser) {
        renderSignedIn(elements, currentUser);
        // The menu is built from the role the backend reported. Nothing is
        // hardcoded, so a group the visitor may not use is never rendered.
        renderMenu(elements.menu, currentUser);
        setState(elements.actions, AUTH_STATE.AUTHENTICATED);

        attachAccountMenu({
          trigger: elements.trigger,
          menu: elements.menu,
          onLogout: async () => {
            // Signing out is irreversible from the visitor's side, so it is
            // confirmed rather than fired on the first click.
            const confirmed = await confirmLogout({ name: currentUser?.name ?? '' });
            if (!confirmed) return;
            await signOut(elements);
          },
          // Anchors navigate themselves; the handler exists so the panel is
          // dismissed first regardless of how the click arrived.
          onNavigate: () => {},
        });
        return;
      }

      renderSignedOut(elements);
      setState(elements.actions, AUTH_STATE.ANONYMOUS);

      // 401 is the ordinary signed-out answer. Anything else means the
      // session could not be confirmed, which is reported rather than
      // silently presented as proof that nobody is signed in.
      if (status !== 401 && status !== 403 && status !== 0) {
        console.warn('[Navbar] session check failed:', status);
      }
    })
    .catch((error) => {
      renderSignedOut(elements);
      setState(elements.actions, AUTH_STATE.ANONYMOUS);
      console.error('[Navbar] session check threw:', error);
    });
}

/* ── Log out ────────────────────────────────────────────────────── */

async function signOut(elements) {
  if (elements.trigger.disabled) return;

  elements.trigger.disabled = true;
  const result = await logout();

  if (!result.success) {
    // The cookie may still be valid, so the signed-in view is kept and the
    // failure is reported rather than pretended away. A silent failure here
    // is what makes a later visit look like the sign-out never happened.
    elements.trigger.disabled = false;
    console.warn('[Navbar] sign out failed:', result.status);
    showToast({
      type: 'error',
      title: 'Not signed out',
      message: "We couldn't end your session. Please check your connection and try again.",
    });
    return;
  }

  // The server cleared the cookie. Drop the local view of the session and
  // empty the menu, so no signed-in destination is left in the document.
  elements.menu.replaceChildren();
  renderSignedOut(elements);
  setState(elements.actions, AUTH_STATE.ANONYMOUS);
  elements.trigger.disabled = false;

  // Signing out does not reload the page, so any page that holds
  // authenticated-only state of its own — the Homepage's saved-item hearts,
  // the Saved Products list — still believes it is signed in. Announce the
  // confirmed sign-out so those pages can drop that state too.
  window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT));
}