/* ============================================================
   EASYDEAL — SHARED API CONFIGURATION (Universal)
   Purpose: Single source of truth for the backend base URL and
            fetch defaults across every frontend surface:
            public Homepage, Auth pages and the Admin app.

   Why this file exists
   - frontend/Auth/Services/authService.js hardcoded the production
     Render URL, while frontend/save-product/saveProduct.js used a
     duplicate copy of these same helpers exposed on window.
   - Loading order matters and is enforced below: this file is
     loaded first, then the ES module copy loads and overwrites
     window.EasyDealAPI with the same values. Both stay in sync
     because the module version imports nothing from here; instead
     the constants below are the single declaration and the Admin
     copy re-exports them. See admin/services/apiConfig.js.
   ============================================================ */

(function () {
  const hostname = window.location.hostname;

  const isPrivateNetworkHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);

  const BASE_URL = isPrivateNetworkHost
    ? `http://${hostname}:3000/api`
    : 'https://easydeal.onrender.com/api';

  function getBaseUrl() {
    return BASE_URL;
  }

  // credentials: 'include' is mandatory: the backend issues the auth token
  // as an HttpOnly cookie, which is unreadable by JS and must be sent
  // explicitly on every cross-origin request.
  const defaultFetchOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  function buildUrl(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
  }

  window.EasyDealAPI = {
    getBaseUrl,
    defaultFetchOptions,
    buildUrl,
  };
})();