/* ============================================================
   EASYDEAL - THEME (Admin entry point)

   Kept as the Admin's import path. The implementation now lives in the
   shared theme module so the Admin app, the Auth pages and the shared
   navbar cannot drift apart on the storage key or the default.
   ============================================================ */

import {
  applyTheme as applySharedTheme,
  getCurrentTheme as getSharedTheme,
  initTheme as initSharedTheme,
  mountThemeToggles,
} from '../../shared/services/theme.js';

export function initTheme() {
  initSharedTheme();
  // The Admin navbar renders its own toggle button.
  mountThemeToggles(document);
}

export const applyTheme = applySharedTheme;
export const getCurrentTheme = getSharedTheme;