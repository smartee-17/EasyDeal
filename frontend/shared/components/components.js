/* ============================================================
   EASYDEAL — SHARED COMPONENT MOUNT

   One entry point that puts the navbar and footer on any page that declares
   their mount points:

     <div data-component="header"></div>
     <div data-component="footer"></div>

   Loaded as a module, so it is deferred and the mount points are guaranteed
   to exist. Both components build their own markup, so there is no fragment
   to fetch. Login and Signup declare neither mount point and keep their own
   layout.
   ============================================================ */

import { mountNavbar } from './navbar/navbar.js';
import { mountFooter } from './footer/footer.js';

/* The modal's stylesheet is injected here rather than linked from each page.
   The dialog is reachable from the navbar's account menu, which every page
   that mounts the navbar can reach, so requiring every page to remember a
   <link> would eventually leave one page with an unstyled dialog. */
const SHARED_STYLES = ['/frontend/shared/components/modal/modal.css'];

function loadStyles(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

/**
 * Mount both shared components on the current page.
 *
 * Safe to call more than once: each component ignores a container it has
 * already filled, so repeated mounting cannot duplicate either one.
 */
export function mountSharedComponents() {
  SHARED_STYLES.forEach(loadStyles);
  mountNavbar(document.querySelector('[data-component="header"]'));
  mountFooter(document.querySelector('[data-component="footer"]'));
}

/* Running on import is what lets a page opt in with a single script tag.
   A module is deferred, so the document is parsed and the mount points
   exist by the time this executes. The DOMContentLoaded branch is kept for
   the case where this module is ever loaded dynamically after load. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountSharedComponents, { once: true });
} else {
  mountSharedComponents();
}