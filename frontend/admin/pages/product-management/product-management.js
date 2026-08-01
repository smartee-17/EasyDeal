/* ============================================================
   EASYDEAL — PRODUCT MANAGEMENT PAGE JS
   Purpose: Placeholder for advanced product tools
   ============================================================ */

import { initTheme } from '../../utils/theme.js';
import { initNavbar } from '../../components/navbar/navbar.js';
import { initSidebar } from '../../components/sidebar/sidebar.js';
import { initFooter } from '../../components/footer/footer.js';
import { initAuthGuard } from '../../services/authService.js';

initTheme();
initNavbar({ context: 'admin', searchPlaceholder: 'Search...' });
initSidebar();
initFooter();

initAuthGuard();