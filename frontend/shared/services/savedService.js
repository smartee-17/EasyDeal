/* ============================================================
   EASYDEAL — SAVED ITEMS SERVICE
   Purpose: The only place the frontend talks to /api/saved.

   Why a separate service
   Saved Items is a protected, non-authentication API. It must not go
   through Auth/Services/authService.js, which exists solely for
   credential and session calls, but it needs the same request
   discipline: one declaration of the base URL, one place that knows
   the backend's response envelope, and no duplicated fetch options.

   There was no general (non-auth) service layer to extend —
   frontend/Homepage/homepage.js carried a private apiGet() and
   frontend/product-view/api.js hardcoded the production URL. Rather
   than duplicate that request logic, it lives here once.

   Backend contract (verified, not assumed)
   - GET    /api/saved              list the caller's saved items
                                    always 200; empty list is success
                                    each item: { _id, productId, userId }
                                    productId is the populated product
                                    (null if the product was deleted)
   - POST   /api/saved/:productId   save;  201 created, 200 already saved
   - DELETE /api/saved/:productId   unsave; always 200, idempotent
   - GET    /api/saved/check/:id    single-product check, { saved }

   All four sit behind the `protect` middleware, so every one of them
   answers 401 without a valid session cookie. That 401 is a bare
   { message } object rather than the sendResponse envelope, which is
   why isEnvelope() below matters.

   What the API does NOT provide, and therefore what this service does
   not pretend to provide:
   - No batch "are these saved?" endpoint. Saved state for a whole grid
     must be resolved by listing the caller's saved items once and
     matching product ids client-side. That is why the Homepage calls
     listSavedItems() a single time rather than firing one check per
     product card.
   - No 403 and no 404 on any Saved route. A product that no longer
     exists still saves and unsaves successfully, because the controller
     never looks the product up. Callers must not infer existence from
     a successful save.
   ============================================================ */

import { buildUrl, defaultFetchOptions } from '../apiConfig.js';

/** Product ids are Mongo ObjectIds; anything else is rejected by the
 *  backend with a 400 before it reaches the database. Checking here
 *  keeps a malformed id from becoming a pointless round trip. */
const OBJECT_ID = /^[a-f\d]{24}$/i;

export function isValidProductId(productId) {
  return typeof productId === 'string' && OBJECT_ID.test(productId);
}

/** The backend uses sendResponse: { success, message, data }. */
function isEnvelope(body) {
  return (
    body !== null &&
    typeof body === 'object' &&
    typeof body.success === 'boolean' &&
    typeof body.message === 'string'
  );
}

const NETWORK_ERROR =
  'Could not reach the server. Check your connection and try again.';

const UNAVAILABLE_ERROR =
  'The server is unavailable right now. Please try again shortly.';

/**
 * Perform a Saved Items request and normalise the outcome.
 *
 * Resolves rather than rejects, and never throws, so a card action can
 * handle an expected failure without a try/catch around every call.
 *
 * @returns {Promise<{success: boolean, message: string, data: any, status: number}>}
 *   status is the HTTP status, or 0 when the request never reached the
 *   API. Callers must check it: 401 means the session is gone, which is
 *   a different situation from the server being unreachable.
 */
async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(buildUrl(path), {
      ...defaultFetchOptions,
      ...options,
    });
  } catch {
    return { success: false, message: NETWORK_ERROR, data: null, status: 0 };
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  // The auth middleware answers 401 with a bare { message }, so the
  // envelope check has a fallback for that shape. The message is never
  // surfaced to the user directly; it exists for the console.
  if (isEnvelope(body)) {
    return {
      success: body.success && response.ok,
      message: body.message,
      data: body.data ?? null,
      status: response.status,
    };
  }

  if (body !== null && typeof body === 'object' && typeof body.message === 'string') {
    return {
      success: false,
      message: body.message,
      data: null,
      status: response.status,
    };
  }

  return {
    success: false,
    message: response.status >= 500 ? UNAVAILABLE_ERROR : NETWORK_ERROR,
    data: null,
    status: response.status,
  };
}

/* ── Public API ─────────────────────────────────────────────── */

/**
 * Every saved item for the current session.
 *
 * Call once per page load, not once per product card: the backend has
 * no batch check endpoint, so this list is the only way to know the
 * saved state of many products at once.
 *
 * @returns {Promise<{success: boolean, message: string, items: Array, status: number}>}
 *   `items` is the raw envelope data, or [] when the call failed.
 */
export async function listSavedItems() {
  const result = await request('/saved', { method: 'GET' });
  return {
    success: result.success,
    message: result.message,
    items: Array.isArray(result.data) ? result.data : [],
    status: result.status,
  };
}

/**
 * The ids of the current session's saved products.
 *
 * Matches on productId._id, which is what both the populated list and
 * the product listing payload use. Entries whose product has been
 * deleted arrive as a null productId and are skipped rather than
 * treated as a saved product.
 *
 * @returns {Promise<{success: boolean, savedIds: Set<string>, status: number}>}
 */
export async function fetchSavedProductIds() {
  const { success, items, status } = await listSavedItems();

  const savedIds = new Set();
  if (success) {
    for (const item of items) {
      const id = item?.productId?._id ?? item?.productId;
      if (typeof id === 'string') savedIds.add(id);
    }
  }

  return { success, savedIds, status };
}

/**
 * Save a product. Idempotent server-side: an already-saved product
 * answers 200 rather than creating a duplicate.
 */
export function saveProduct(productId) {
  if (!isValidProductId(productId)) {
    return Promise.resolve({
      success: false,
      message: 'That product cannot be saved.',
      data: null,
      status: 0,
    });
  }

  return request(`/saved/${encodeURIComponent(productId)}`, { method: 'POST' });
}

/**
 * Remove a product from the saved list. Idempotent server-side: a
 * product that was never saved answers 200 with a null payload.
 */
export function unsaveProduct(productId) {
  if (!isValidProductId(productId)) {
    return Promise.resolve({
      success: false,
      message: 'That product cannot be removed.',
      data: null,
      status: 0,
    });
  }

  return request(`/saved/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}
