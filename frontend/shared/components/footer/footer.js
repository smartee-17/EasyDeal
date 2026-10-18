/* ============================================================
   EASYDEAL - UNIVERSAL FOOTER (JavaScript component)

   Builds and mounts the one footer every public page uses. Building it here
   removes the old fetch-and-inject, so the footer cannot render half
   delivered.

   Content is recovered from the original Homepage footer at commit 25b0fcd.
   A link whose page does not exist renders as href=#.

   Usage:
     import { mountFooter } from '../shared/components/footer/footer.js';
     mountFooter(document.querySelector('[data-component=footer]'));
   ============================================================ */
import {
  iconGitHub,
  iconInstagram,
  iconLinkedIn,
  iconXTwitter,
} from '../icons/icons.js';

/* A dataset key is camelCase; it reaches the DOM as the data-footer-mounted
   attribute. */
const MOUNTED_FLAG = 'footerMounted';

/** The Homepage is the product catalogue and answers the navbar's search. */
const HOMEPAGE_URL = '/frontend/Homepage/homepage.html';

/** The saved-items page. */
const SAVED_ITEMS_URL = '/frontend/save-product/saveProduct.html';

/**
 * The footer's navigation groups.
 *
 * `href: null` means no page exists for that label yet. Those render as
 * href="#" so the footer never presents a dead route as a working
 * destination, and no placeholder page is created purely to make a link
 * appear to work. The list of real destinations is a project decision, not
 * something to guess at from the label.
 */
const LINK_GROUPS = [
  {
    heading: 'Marketplace',
    links: [
      { label: 'Browse Products', href: HOMEPAGE_URL },
      // The category rail is a real destination on the Homepage.
      { label: 'Categories', href: `${HOMEPAGE_URL}#categories` },
      { label: 'Saved Items', href: SAVED_ITEMS_URL },
      { label: 'Sell a Product', href: null },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: null },
      { label: 'Contact', href: null },
      { label: 'Partners', href: null },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: null },
      { label: 'Contact Us', href: null },
      { label: 'FAQs', href: null },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', icon: () => iconInstagram({ size: 20 }) },
  { label: 'X', icon: () => iconXTwitter({ size: 20 }) },
  { label: 'LinkedIn', icon: () => iconLinkedIn({ size: 20 }) },
  { label: 'GitHub', icon: () => iconGitHub({ size: 20 }) },
];

const LEGAL_LINKS = ['Privacy policy', 'Terms of service', 'Cookies settings'];

const COPYRIGHT = '© 2026 EasyDeal. All rights reserved.';
const TAGLINE = 'Buy and sell products easily. Connect directly with sellers through WhatsApp.';

/* ── View helpers ─────────────────────────────────────────────────── */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    // textContent, never innerHTML: no value here comes from a user or from
    // the backend.
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child) node.append(child);
  }
  return node;
}

/**
 * One navigation link.
 * A label with no destination becomes href="#", which is the honest marker
 * for "this page does not exist yet".
 */
function linkNode(label, href) {
  return el('a', { href: href || '#', text: label });
}

/** A social anchor. The glyph is decorative, so the accessible name comes
 *  from aria-label rather than a hidden text node. */
function socialNode({ label, icon }) {
  const anchor = el('a', { href: '#', 'aria-label': label });
  // The shared library returns its own static markup; no user data is
  // involved, and the <svg> it produces is a single, properly closed node.
  anchor.innerHTML = icon();
  return anchor;
}

function groupNode({ heading, links }) {
  return el('div', { class: 'footer-placeholder__links' }, [
    el('h4', { text: heading }),
    ...links.map((entry) => linkNode(entry.label, entry.href)),
  ]);
}

/**
 * Build a complete footer element.
 * @returns {HTMLElement} a detached <footer class="footer-placeholder">
 */
export function createFooter() {
  const brand = el('div', { class: 'footer-placeholder__brand' }, [
    el('h2', { class: 'brand-logo' }, [
      el('span', { class: 'footer-placeholder__icon' }, [
        el('img', {
          src: '/frontend/assets/images/logos/icon-dark.svg',
          alt: 'ED',
        }),
      ]),
      document.createTextNode('EasyDeal'),
    ]),
    el('p', { text: TAGLINE }),
    el('div', { class: 'footer-placeholder__socials' }, SOCIAL_LINKS.map(socialNode)),
  ]);

  const inner = el('div', { class: 'container footer-placeholder__inner' }, [
    brand,
    ...LINK_GROUPS.map(groupNode),
  ]);

  const bottom = el('div', { class: 'container footer-placeholder__bottom' }, [
    el('p', { class: 'copyright', text: COPYRIGHT }),
    el('div', { class: 'footer-placeholder__legal' },
      LEGAL_LINKS.map((label) => linkNode(label, null))),
  ]);

  return el('footer', { class: 'footer-placeholder' }, [inner, bottom]);
}

/* ── Mounting ─────────────────────────────────────────────────────── */

/**
 * Mount the footer into a container, exactly once.
 *
 * A second call returns the footer already in place instead of adding
 * another one, so a page that imports this module twice cannot end up with
 * duplicate footers.
 *
 * @param {Element} container
 * @returns {HTMLElement|null} the mounted footer, or null if no container
 */
export function mountFooter(container) {
  if (!container) {
    console.error(
      '[Footer] mountFooter() called without a container. Add a ' +
        '<div data-component="footer"></div> mount point to the page.',
    );
    return null;
  }

  if (container.dataset[MOUNTED_FLAG] === 'true') {
    return container.querySelector('.footer-placeholder');
  }

  const footer = createFooter();
  container.replaceChildren(footer);
  container.dataset[MOUNTED_FLAG] = 'true';

  return footer;
}

/** Exported for verification and diagnostics: what the footer should render. */
export const FOOTER_CONTENT = Object.freeze({
  tagline: TAGLINE,
  copyright: COPYRIGHT,
  groups: LINK_GROUPS.map((g) => ({
    heading: g.heading,
    links: g.links.map((l) => l.label),
  })),
  legal: [...LEGAL_LINKS],
  socials: SOCIAL_LINKS.map((s) => s.label),
});