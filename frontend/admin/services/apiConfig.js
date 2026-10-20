/* ============================================================
   EASYDEAL — API CONFIGURATION
   Purpose: Backward-compatible re-export so existing Admin imports
            keep working while the values now live in one place.

   frontend/admin/services/apiConfig.js previously declared the base
   URL and fetch defaults itself. That copy is now
   frontend/shared/apiConfig.js, shared with the public Auth pages.
   This file only forwards, so authService.js and dashboardService.js
   need no change.
   ============================================================ */

export {
  getBaseUrl,
  defaultFetchOptions,
  buildUrl,
} from '../../shared/apiConfig.js';