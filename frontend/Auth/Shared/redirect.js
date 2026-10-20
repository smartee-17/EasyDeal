/* ============================================================
   EASYDEAL — POST-AUTHENTICATION REDIRECT
   Purpose: Decide where a visitor lands once a session exists.

   Shared by Login and Signup so the two pages cannot drift apart.
   Holds no network calls and touches no browser storage beyond a
   single non-auth entry that records where the visitor was heading.
   ============================================================ */

/* * Non-auth state: the intended destination, never anything about the
 *  session. Written by the Homepage when a protected action needs a
 *  session, read here by Login/Signup to decide where to continue. */
export const PENDING_ACTION_KEY = 'easydeal-pending-action';

/**
 * Destinations the application is allowed to resume at.
 *
 * Storing an arbitrary string would make the pending action an open
 * redirect, so the write side only accepts values from this list and the
 * read side only honours values that resolve to it. Keeping the check on
 * both ends means a hand-edited sessionStorage entry is rejected even if
 * it came from this page.
 *
 * Only real, existing pages belong here. A protected action whose
 * destination page does not exist yet must not add an entry.
 */
export const ALLOWED_PENDING_DESTINATIONS = Object.freeze([
  '/frontend/Homepage/homepage.html',
  '/frontend/save-product/saveProduct.html',
  '/frontend/Auth/Login/login.html',
  '/frontend/Auth/Signup/signup.html',
]);

/**
 * Action types this application knows how to resume.
 *
 * A pending action may optionally name one of these. It never carries a
 * script, a query string or a free-form instruction: the type is a closed
 * enum, and the product id is a Mongo ObjectId validated against a strict
 * pattern below. Anything unrecognised is discarded rather than guessed at.
 */
export const ALLOWED_PENDING_ACTIONS = Object.freeze(['save-product']);

/**
 * Destinations a session may never be resumed AT.
 *
 * The Auth pages are legitimate places to have been, but resuming to one
 * would bounce an already-authenticated visitor straight back into the
 * auth flow. Excluding them here is what makes a stale or hand-edited
 * entry unable to produce a Login -> Login -> Login loop.
 */
const RESUME_FORBIDDEN_DESTINATIONS = Object.freeze([
  '/frontend/Auth/Login/login.html',
  '/frontend/Auth/Signup/signup.html',
]);

/** Mongo ObjectId: exactly 24 hex characters, nothing else. */
const OBJECT_ID = /^[a-f\d]{24}$/i;

export function isValidProductId(value) {
  return typeof value === 'string' && OBJECT_ID.test(value);
}

/**
 * Whether a recognised destination may also be resumed TO.
 *
 * The Auth pages are known application destinations, so they pass the
 * allowlist, but resuming to one would bounce an already-authenticated
 * visitor straight back into the auth flow. Rejecting them at validation
 * time means the invariant holds for every consumer: a record that can
 * be stored is a record that can actually be resumed.
 */
export function isResumableDestination(destination) {
  if (!isAllowedDestination(destination)) return false;

  try {
    const path = new URL(destination, window.location.origin).pathname;
    return !RESUME_FORBIDDEN_DESTINATIONS.some(
      (forbidden) => forbidden.toLowerCase() === path.toLowerCase(),
    );
  } catch {
    return false;
  }
}

/**
 * Whether a value is a destination this application may resume at.
 *
 * Three things must all hold:
 *   - it parses as a URL at all (so javascript:, data: and malformed
 *     values are rejected before anything is stored or followed)
 *   - it resolves to this origin, which rules out //evil.example.com
 *     and https://evil.example.com
 *   - its protocol is http or https
 *   - its path is one of ALLOWED_PENDING_DESTINATIONS
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isAllowedDestination(value) {
  if (typeof value !== 'string' || value === '') return false;

  let url;
  try {
    url = new URL(value, window.location.origin);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.origin !== window.location.origin) return false;

  // Compared on pathname so a query string or hash on an approved page
  // is still an approved destination.
  return ALLOWED_PENDING_DESTINATIONS.some(
    (allowed) => url.pathname.toLowerCase() === allowed.toLowerCase(),
  );
}

/**
 * Validate a stored raw value and return a normalised pending action.
 *
 * Accepts two shapes and nothing else:
 *   - a plain allowlisted destination string
 *   - { type, destination, productId } where type is in
 *     ALLOWED_PENDING_ACTIONS and productId is a bare ObjectId
 *
 * The destination is always re-checked against the allowlist, so an object
 * cannot smuggle a different target past validation by looking valid.
 * Callers get either a trusted record or null.
 *
 * @param {unknown} raw
 * @returns {{type: string|null, destination: string, productId: string|null}|null}
 */
function normalisePendingAction(raw) {
  if (typeof raw === 'string') {
    if (!isResumableDestination(raw)) return null;
    const path = new URL(raw, window.location.origin).pathname;
    return { type: null, destination: path, productId: null };
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const { type, destination, productId } = raw;

  if (typeof type !== 'string' || !ALLOWED_PENDING_ACTIONS.includes(type)) {
    return null;
  }
  if (!isResumableDestination(destination)) return null;

  // Only save-product is defined, and it needs a product to act on. A
  // record without one is meaningless, so it is rejected rather than
  // resumed as a bare navigation.
  if (type === 'save-product' && !isValidProductId(productId)) return null;

  return {
    type,
    destination: new URL(destination, window.location.origin).pathname,
    productId: isValidProductId(productId) ? productId : null,
  };
}

/**
 * Read the pending action WITHOUT consuming it.
 *
 * Used by the auth pages to decide where to send a session that has just
 * been established. The record itself is left in place so the destination
 * page can still act on it; that page consumes it exactly once.
 *
 * An unreadable or poisoned value is cleared here, so it cannot be read
 * again later.
 *
 * @returns {{type: string|null, destination: string, productId: string|null}|null}
 */
export function readPendingActionRecord() {
  let raw;

  try {
    raw = window.sessionStorage.getItem(PENDING_ACTION_KEY);
  } catch {
    return null;
  }

  // An absent entry and a deliberately emptied one are both "nothing to
  // do". Clearing here means a poisoned empty value cannot sit in storage
  // indefinitely.
  if (!raw) {
    clearPendingAction();
    return null;
  }

  let parsed = raw;
  // A record is stored as JSON; a plain destination is stored as text.
  if (typeof raw === 'string' && raw.trimStart().startsWith('{')) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  const record = normalisePendingAction(parsed);

  if (!record) {
    clearPendingAction();
    return null;
  }

  return record;
}

/**
 * Read the pending action and remove it in one step.
 *
 * This is the consume path, called by the page that actually performs the
 * action. Consuming on read is what stops a stale action from re-firing on
 * every subsequent page load.
 *
 * @returns {{type: string|null, destination: string, productId: string|null}|null}
 */
export function consumePendingAction() {
  const record = readPendingActionRecord();
  if (record) clearPendingAction();
  return record;
}

/**
 * Record where the visitor was heading before being sent to log in.
 *
 * Two forms are accepted:
 *   rememberPendingAction('/frontend/Homepage/homepage.html')
 *   rememberPendingAction({ type: 'save-product',
 *                           destination: '/frontend/Homepage/homepage.html',
 *                           productId: '6aae...' })
 *
 * Rejects anything not on the allowlist, so this cannot plant an arbitrary
 * redirect target even when handed a user-influenced string.
 *
 * @param {string|{type: string, destination: string, productId?: string}} action
 * @returns {boolean} whether something valid was stored
 */
export function rememberPendingAction(action) {
  const record = normalisePendingAction(action);

  if (!record) return false;

  const serialised =
    record.type === null
      ? record.destination
      : JSON.stringify({
          type: record.type,
          destination: record.destination,
          productId: record.productId,
        });

  try {
    window.sessionStorage.setItem(PENDING_ACTION_KEY, serialised);
    return true;
  } catch {
    // Storage unavailable. The visitor still reaches Login; they just
    // return to the default destination instead of this one.
    return false;
  }
}

/**
 * Read a redirect target stashed before the visitor was sent to log in.
 *
 * Only same-origin http(s) URLs that are on the application allowlist
 * are honoured. Accepting an arbitrary stored value would turn this
 * into an open redirect, so a hostile or stale entry is discarded
 * rather than followed.
 *
 * @returns {string|null}
 */
export function readPendingAction() {
  const record = readPendingActionRecord();

  if (!record) return null;

  // A bare destination has no action attached, so nothing downstream needs
  // it and it is consumed here. A typed record is left for the destination
  // page to act on and consume.
  if (record.type === null) clearPendingAction();

  try {
    return new URL(record.destination, window.location.origin).href;
  } catch {
    clearPendingAction();
    return null;
  }
}

export function clearPendingAction() {
  try {
    window.sessionStorage.removeItem(PENDING_ACTION_KEY);
  } catch {
    /* Nothing to clean up. */
  }
}

/** Where an authenticated visitor should continue after logging in. */
export function destinationFor(role) {
  if (role === 'admin') {
    return new URL('../../admin/pages/dashboard/dashboard.html', import.meta.url).href;
  }

  const record = readPendingActionRecord();

  if (record) {
    // Validation already refuses a record aimed at an auth page, so this
    // is a belt-and-braces guard rather than the primary defence.
    if (isResumableDestination(record.destination)) {
      try {
        return new URL(record.destination, window.location.origin).href;
      } catch {
        // Unreachable for a validated path, but never hand a raw value to
        // location.href regardless.
        clearPendingAction();
      }
    } else {
      clearPendingAction();
    }
  }

  return new URL('../../Homepage/homepage.html', import.meta.url).href;
}

/**
 * Where to send someone who has just registered.
 *
 * Both Buyer and Seller land on the Homepage: no seller or buyer
 * dashboard exists yet, so none is invented here.
 *
 * Signup deliberately does NOT resume a pending protected action. A new
 * account has saved nothing, so resuming "save this product" would act on
 * a state the account has no relationship to. The approved signup
 * destination wins outright.
 *
 * The pending action is cleared rather than left behind: it was never
 * honoured, so keeping it would let a stale action fire much later, after
 * an unrelated logout and login.
 */
export function destinationAfterSignup() {
  clearPendingAction();
  return new URL('../../Homepage/homepage.html', import.meta.url).href;
}

/**
 * Navigate to the post-authentication destination.
 *
 * @param {string} [role] role reported by the backend
 */
export function redirectAfterAuth(role) {
  window.location.href = destinationFor(role);
}