/* ============================================================
   EASYDEAL — SHARED API CONFIGURATION (ES module)
   Purpose: The one declaration of the backend base URL and the
            default fetch options for the whole frontend.

   Consumers
   - frontend/Auth/Services/authService.js   (public Auth pages)
   - frontend/admin/services/apiConfig.js    (re-exports this)
   - frontend/admin/services/authService.js
   - frontend/admin/services/dashboardService.js

   Why a separate shared/config.js also exists
   classic <script> pages such as save-product/saveProduct.html cannot
   import an ES module, so shared/config.js repeats these values and
   exposes them on window.EasyDealAPI. Keep the two blocks in step:
   the hostname test and the URL shapes are identical by construction.
   ============================================================ */

const hostname = window.location.hostname;

const isPrivateNetworkHost =
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^10\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}$/.test(hostname);

const BASE_URL = isPrivateNetworkHost
  ? `http://${hostname}:3000/api`
  : 'https://easydeal.onrender.com/api';

export function getBaseUrl() {
  return BASE_URL;
}

/** credentials: 'include' is required, not optional: the auth token is an
 *  HttpOnly cookie that JavaScript cannot read, so it must be attached
 *  explicitly on every cross-origin request. */
export const defaultFetchOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

export function buildUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}