/* ============================================================
   EASYDEAL — FOOTER COMPONENT
   Purpose: Shared footer behavior
   Usage:   Import and call initFooter() if dynamic behavior needed
   ============================================================ */

import { iconInstagram, iconXTwitter, iconLinkedIn, iconGitHub } from '../icons/icons.js';

/**
 * Initialize footer interactivity
 * Currently handles icon rendering for social links
 */
export function initFooter() {
  const socials = document.querySelectorAll('.footer__social-link');
  socials.forEach(link => {
    const platform = link.dataset.platform;
    if (!platform) return;

    let iconHtml = '';
    switch (platform) {
      case 'instagram':
        iconHtml = iconInstagram({ size: 18 });
        break;
      case 'x-twitter':
        iconHtml = iconXTwitter({ size: 18 });
        break;
      case 'linkedin':
        iconHtml = iconLinkedIn({ size: 18 });
        break;
      case 'github':
        iconHtml = iconGitHub({ size: 18 });
        break;
    }
    if (iconHtml) {
      link.innerHTML = iconHtml;
    }
  });
}