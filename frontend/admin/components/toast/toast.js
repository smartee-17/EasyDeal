/* ============================================================
   EASYDEAL — TOAST NOTIFICATION SYSTEM
   Purpose: Programmatic toast messages across all pages
   Usage:
     import { showToast } from '../components/toast/toast.js';
     showToast({ type: 'success', title: 'Saved', message: 'Product updated.' });
   ============================================================ */

import { iconCheck, iconX, iconWarning, iconInfo, iconClose } from '../icons/icons.js';

const DEFAULT_DURATION = 5000;
const CONTAINER_ID = 'toast-container';

/**
 * Show a toast notification
 * @param {Object} options
 * @param {'success'|'error'|'warning'|'info'} options.type
 * @param {string} options.title
 * @param {string} options.message
 * @param {number} options.duration - ms before auto-dismiss (default: 5000)
 * @param {boolean} options.dismissible - show close button (default: true)
 * @returns {HTMLElement} the toast element
 */
export function showToast(options = {}) {
  const {
    type = 'info',
    title = '',
    message = '',
    duration = DEFAULT_DURATION,
    dismissible = true,
  } = options;

  const container = getContainer();
  const toast = createToastElement({ type, title, message, duration, dismissible });

  container.appendChild(toast);

  // Auto-dismiss
  let timeoutId;
  if (duration > 0) {
    timeoutId = setTimeout(() => dismissToast(toast), duration);
  }

  // Pause on hover
  toast.addEventListener('mouseenter', () => clearTimeout(timeoutId));
  toast.addEventListener('mouseleave', () => {
    const remaining = getRemainingTime(toast, duration);
    if (remaining > 0) {
      timeoutId = setTimeout(() => dismissToast(toast), remaining);
    }
  });

  return toast;
}

/**
 * Dismiss a specific toast
 * @param {HTMLElement} toast
 */
export function dismissToast(toast) {
  if (!toast || toast.classList.contains('is-exiting')) return;

  toast.classList.add('is-exiting');
  toast.addEventListener('animationend', () => {
    toast.remove();
    removeContainerIfEmpty();
  }, { once: true });
}

/**
 * Dismiss all active toasts
 */
export function dismissAllToasts() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;
  container.querySelectorAll('.toast').forEach(dismissToast);
}

/* ── Internal Helpers ──────────────────────────────────────── */

function getContainer() {
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
  }
  return container;
}

function removeContainerIfEmpty() {
  const container = document.getElementById(CONTAINER_ID);
  if (container && container.children.length === 0) {
    container.remove();
  }
}

function createToastElement({ type, title, message, duration, dismissible }) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');

  const iconHtml = getIconForType(type);
  const progressHtml = duration > 0
    ? `<div class="toast__progress" style="animation-duration: ${duration}ms;"></div>`
    : '';

  const closeHtml = dismissible
    ? `<button type="button" class="toast__close" aria-label="Dismiss notification">${iconClose({ size: 16 })}</button>`
    : '';

  const titleHtml = title ? `<div class="toast__title">${escapeHtml(title)}</div>` : '';
  const messageHtml = message ? `<div class="toast__message">${escapeHtml(message)}</div>` : '';

  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${iconHtml}</span>
    <div class="toast__content">
      ${titleHtml}
      ${messageHtml}
    </div>
    ${closeHtml}
    ${progressHtml}
  `;

  // Bind close button
  if (dismissible) {
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => dismissToast(toast));
  }

  // Store creation time for pause/resume
  toast.dataset.createdAt = Date.now().toString();

  return toast;
}

function getIconForType(type) {
  switch (type) {
    case 'success': return iconCheck({ size: 22 });
    case 'error':   return iconX({ size: 22 });
    case 'warning': return iconWarning({ size: 22 });
    case 'info':
    default:        return iconInfo({ size: 22 });
  }
}

function getRemainingTime(toast, totalDuration) {
  const created = parseInt(toast.dataset.createdAt, 10);
  const elapsed = Date.now() - created;
  return Math.max(0, totalDuration - elapsed);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}