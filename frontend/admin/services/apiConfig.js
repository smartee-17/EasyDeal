/* ============================================================
   EASYDEAL — API CONFIGURATION
   Purpose: Centralized backend URL and fetch defaults
   Backend: Localhost / Render
   Prefix: /api
   ============================================================ */
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

export function getBaseUrl() {
  return BASE_URL;
}

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