/* ============================================================
   EASYDEAL — API CONFIGURATION
   Purpose: Centralized backend URL and fetch defaults
   Backend: http://localhost:3000 (from server.js)
   Prefix: /api (from app.js)
   ============================================================ */

const BASE_URL = 'http://localhost:3000/api' || 'https://easydeal.onrender.com/api/';

export function getBaseUrl() {
  return BASE_URL;
}

export const defaultFetchOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export function buildUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}