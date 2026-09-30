/* ============================================================
   EASYDEAL — ICON LIBRARY
   Version: 1.0
   Purpose: Reusable SVG icon system
   Usage:   import { iconHome } from './icons.js';
            element.innerHTML = iconHome({ size: 32, className: 'nav-icon' });
   ============================================================ */

const DEFAULT_SIZE = 24;
const DEFAULT_STROKE = 2;

function createIcon(name, svgContent) {
  return function renderIcon(props = {}) {
    const size = props.size ?? DEFAULT_SIZE;
    const strokeWidth = props.strokeWidth ?? DEFAULT_STROKE;
    const className = props.className ?? '';
    const ariaLabel = props.ariaLabel ?? name.replace(/-/g, ' ');
    const ariaHidden = props.ariaHidden ?? !props.ariaLabel;

    const classes = ['icon', `icon--${name}`, className]
      .filter(Boolean)
      .join(' ');

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `width="${size}" height="${size}" ` +
      `viewBox="0 0 24 24" fill="none" ` +
      `stroke="currentColor" stroke-width="${strokeWidth}" ` +
      `stroke-linecap="round" stroke-linejoin="round" ` +
      `class="${classes}" ` +
      `${ariaHidden ? 'aria-hidden="true"' : `aria-label="${ariaLabel}" role="img"`}>` +
      `${svgContent}</svg>`
    );
  };
}

/* ════════════════════════════════════════════════════════════
   NAVIGATION & ACTIONS
   ════════════════════════════════════════════════════════════ */

export const iconHome = createIcon('home',
  `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`
);

export const iconMenu = createIcon('menu',
  `<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`
);

export const iconClose = createIcon('close',
  `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`
);

export const iconChevronLeft = createIcon('chevron-left',
  `<polyline points="15 18 9 12 15 6"/>`
);

export const iconChevronRight = createIcon('chevron-right',
  `<polyline points="9 18 15 12 9 6"/>`
);

export const iconChevronUp = createIcon('chevron-up',
  `<polyline points="18 15 12 9 6 15"/>`
);

export const iconChevronDown = createIcon('chevron-down',
  `<polyline points="6 9 12 15 18 9"/>`
);

export const iconSearch = createIcon('search',
  `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`
);

export const iconFilter = createIcon('filter',
  `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`
);

export const iconMoreVertical = createIcon('more-vertical',
  `<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>`
);

/* ════════════════════════════════════════════════════════════
   FEEDBACK & STATUS
   ════════════════════════════════════════════════════════════ */

export const iconCheck = createIcon('check',
  `<polyline points="20 6 9 17 4 12"/>`
);

export const iconX = createIcon('x',
  `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`
);

export const iconInfo = createIcon('info',
  `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`
);

export const iconWarning = createIcon('warning',
  `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`
);

export const iconSuccess = createIcon('success',
  `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`
);

/* ════════════════════════════════════════════════════════════
   THEME & DISPLAY
   ════════════════════════════════════════════════════════════ */

export const iconSun = createIcon('sun',
  `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`
);

export const iconMoon = createIcon('moon',
  `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`
);

/* ════════════════════════════════════════════════════════════
   COMMUNICATION
   ════════════════════════════════════════════════════════════ */

export const iconEmail = createIcon('email',
  `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`
);

export const iconPhone = createIcon('phone',
  `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`
);

export const iconLocation = createIcon('location',
  `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`
);

export const iconMessage = createIcon('message',
  `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/>`
);

/* ════════════════════════════════════════════════════════════
   FILES & ACTIONS
   ════════════════════════════════════════════════════════════ */

export const iconDownload = createIcon('download',
  `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`
);

export const iconUpload = createIcon('upload',
  `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`
);

export const iconEdit = createIcon('edit',
  `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`
);

export const iconDelete = createIcon('delete',
  `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>`
);

export const iconAdd = createIcon('add',
  `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`
);

export const iconExternalLink = createIcon('external-link',
  `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`
);

export const iconFile = createIcon('file',
  `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`
);

export const iconFolder = createIcon('folder',
  `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>`
);

export const iconCamera = createIcon('camera',
  `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`
);

/* ════════════════════════════════════════════════════════════
   BUSINESS & SERVICES
   ════════════════════════════════════════════════════════════ */

export const iconStore = createIcon('store',
  `<path d="M3 9l2 9h14l2-9"/><path d="M6 9V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2"/>`
);

export const iconShoppingBag = createIcon('shopping-bag',
  `<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`
);

export const iconImage = createIcon('image',
  `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`
);

/* ════════════════════════════════════════════════════════════
   TIME & EVENTS
   ════════════════════════════════════════════════════════════ */

export const iconCalendar = createIcon('calendar',
  `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`
);

export const iconClock = createIcon('clock',
  `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`
);

/* ════════════════════════════════════════════════════════════
   USER & ADMIN
   ════════════════════════════════════════════════════════════ */

export const iconUser = createIcon('user',
  `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`
);

export const iconDashboard = createIcon('dashboard',
  `<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="14" width="7" height="7"/>`
);

export const iconSettings = createIcon('settings',
  `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`
);

export const iconAnalytics = createIcon('analytics',
  `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`
);

export const iconGrid = createIcon('grid',
  `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`
);

export const iconList = createIcon('list',
  `<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>`
);

export const iconLogout = createIcon('logout',
  `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`
);

export const iconLock = createIcon('lock',
  `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`
);

export const iconBell = createIcon('bell',
  `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`
);

export const iconEye = createIcon('eye',
  `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
);

export const iconEyeOff = createIcon('eye-off',
  `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
);

/* ════════════════════════════════════════════════════════════
   SOCIAL
   ════════════════════════════════════════════════════════════ */

export const iconWhatsApp = createIcon('whatsapp',
  `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`
);

export const iconInstagram = createIcon('instagram',
  `<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>`
);

export const iconXTwitter = createIcon('x-twitter',
  `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`
);

export const iconLinkedIn = createIcon('linkedin',
  `<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>`
);

export const iconGitHub = createIcon('github',
  `<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>`
);

export const iconHeart = createIcon('heart',
  `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`
);

export const iconStar = createIcon('star',
  `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`
);

export const iconAlertTriangle = createIcon('alert-triangle',
  `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`
);

export const iconTrash2 = createIcon('trash-2',
  `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>`
);

export const iconRotateCcw = createIcon('rotate-ccw',
  `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/>`
);

export const iconUnlock = createIcon('unlock',
  `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`
);