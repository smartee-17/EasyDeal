/* ============================================================
   EASYDEAL — AUTHENTICATION SERVICE (Centralized)
   Purpose: The single place every public Auth page talks to the
            backend. No page may call fetch() for authentication.

   Backend contract (Stage 1)
   - POST /api/auth/register          { name, email, phone, password, role, rememberMe }
                                      username is generated server-side.
   - POST /api/auth/login             { emailOrUsername, password, rememberMe }
   - POST /api/auth/logout
   - GET  /api/user/me                current authenticated user
   - POST /api/auth/forgot-password   { email }
   - POST /api/auth/reset-password/:token { newPassword }
   - GET  /api/auth/verify-email/:token
   - POST /api/auth/resend-verification  { email }

   Session architecture
   The backend issues the JWT as an HttpOnly cookie. This service
   never reads, stores or returns the token, and never writes it to
   localStorage or sessionStorage. Authentication state is resolved
   from the backend via getCurrentUser(), which reads the cookie
   implicitly through credentials: 'include'.

   Every method resolves to { success, message, data } and never
   throws for an expected API failure, so pages can render a message
   without try/catch around each call. Network faults are also
   normalised into the same shape.
   ============================================================ */

import { buildUrl, defaultFetchOptions } from '../../shared/apiConfig.js';

/** Approved minimum password length. Mirrors the backend's
 *  PASSWORD_MIN_LENGTH so the form can reject early with the same
 *  number the server would enforce. */
export const PASSWORD_MIN_LENGTH = 8;

/** Frontend labels to backend roles. Buyer signs up as 'user'. */
export const ACCOUNT_TYPES = {
  BUYER: 'user',
  SELLER: 'seller',
};

/* ── Internals ──────────────────────────────────────────────── */

/**
 * Every response from the backend uses the sendResponse envelope:
 *   { success, message, data }
 * Anything else (HTML error page, proxy failure) is treated as a
 * transport fault rather than an API result.
 */
function isEnvelope(body) {
  return (
    body !== null &&
    typeof body === 'object' &&
    typeof body.success === 'boolean' &&
    typeof body.message === 'string'
  );
}

async function readBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

/**
 * Perform an auth request and normalise the outcome.
 *
 * @param {string} path      path below /api, e.g. '/auth/login'
 * @param {RequestInit} [options]
 * @returns {Promise<{success: boolean, message: string, data: object|null, status: number}>}
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

  const body = await readBody(response);

  if (isEnvelope(body)) {
    return {
      success: body.success && response.ok,
      message: body.message,
      data: body.data ?? null,
      status: response.status,
    };
  }

  // Not the expected envelope: the request never reached the API, or the
  // response was replaced by something else (proxy, gateway, offline page).
  return {
    success: false,
    message:
      response.status >= 500
        ? 'The server is unavailable right now. Please try again shortly.'
        : NETWORK_ERROR,
    data: null,
    status: response.status,
  };
}

const json = (body) => ({
  method: 'POST',
  body: JSON.stringify(body),
});

/* ── Session ────────────────────────────────────────────────── */

/**
 * Current authenticated user.
 *
 * @returns {Promise<{success: boolean, message: string, user: object|null, status: number}>}
 *   `user` is null whenever the request fails or the session is absent.
 *   `status` is the HTTP status, or 0 for a transport failure. Callers that
 *   need to tell "no valid session" (401) apart from "server unreachable"
 *   must check it: 401 is an expected signed-out answer, anything else is
 *   an error. Note that /user/me answers 401 from the auth middleware with
 *   a bare { message } body rather than the sendResponse envelope.
 */
export async function getCurrentUser() {
  const result = await request('/user/me', { method: 'GET' });
  return {
    success: result.success,
    message: result.message,
    user: result.success ? result.data?.user ?? null : null,
    status: result.status,
  };
}

/**
 * True when a valid session cookie is present.
 *
 * Deliberately derived from the backend rather than from any browser
 * storage, so it stays correct after the cookie expires or is cleared
 * server-side.
 */
export async function isAuthenticated() {
  const { user } = await getCurrentUser();
  return user !== null;
}

/** Role of the current user, or null when signed out. */
export async function getCurrentUserRole() {
  const { user } = await getCurrentUser();
  return user?.role ?? null;
}

/* ── Credentials ────────────────────────────────────────────── */

/**
 * @param {{emailOrUsername: string, password: string, rememberMe?: boolean}} credentials
 * @returns {Promise<{success: boolean, message: string, user: object|null}>}
 */
export async function login({ emailOrUsername, password, rememberMe = false }) {
  const result = await request('/auth/login', json({ emailOrUsername, password, rememberMe }));
  return {
    success: result.success,
    message: result.message,
    user: result.success ? result.data?.user ?? null : null,
  };
}

/**
 * @param {{name: string, email: string, phone: string, password: string,
 *          role?: 'user'|'seller', rememberMe?: boolean}} details
 *   No username is sent: the backend generates it.
 * @returns {Promise<{success: boolean, message: string, user: object|null}>}
 */
export async function register({
  name,
  email,
  phone,
  password,
  role = ACCOUNT_TYPES.BUYER,
  rememberMe = false,
}) {
  const result = await request(
    '/auth/register',
    json({ name, email, phone, password, role, rememberMe }),
  );
  return {
    success: result.success,
    message: result.message,
    user: result.success ? result.data?.user ?? null : null,
  };
}

/** Clears the auth cookie server-side. */
export async function logout() {
  return request('/auth/logout', { method: 'POST' });
}

/* ── Password recovery ──────────────────────────────────────── */

/**
 * Always resolves to the backend's message. The endpoint answers
 * identically whether or not the address exists, so callers must not
 * infer account existence from the response.
 */
export async function forgotPassword(email) {
  const result = await request('/auth/forgot-password', json({ email }));
  return { success: result.success, message: result.message };
}

/**
 * @param {string} token       raw token from the emailed reset link
 * @param {string} newPassword at least PASSWORD_MIN_LENGTH characters
 */
export async function resetPassword(token, newPassword) {
  const result = await request(
    `/auth/reset-password/${encodeURIComponent(token)}`,
    json({ newPassword }),
  );
  return { success: result.success, message: result.message };
}

/* ── Email verification ─────────────────────────────────────── */

/**
 * Consumes a verification token from an emailed link. This is a GET
 * on the backend because the link is followed directly by a browser.
 */
export async function verifyEmail(token) {
  const result = await request(
    `/auth/verify-email/${encodeURIComponent(token)}`,
    { method: 'GET' },
  );
  return { success: result.success, message: result.message };
}

/** Requests a fresh verification email. */
export async function resendVerification(email) {
  const result = await request('/auth/resend-verification', json({ email }));
  return { success: result.success, message: result.message };
}