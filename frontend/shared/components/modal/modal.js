/* ============================================================
   EASYDEAL — SHARED MODAL
   Purpose: One accessible dialog for every page, starting with the
            logout confirmation.
   Usage:
     import { confirmLogout } from '../modal/modal.js';
     confirmLogout({ onConfirm: () => signOut() });

   Design rules:
     - a single reusable root, built lazily and reused, so opening two
       dialogs can never leave a second backdrop behind
     - keyboard-complete: focus moves in on open, is trapped inside while
       open, Escape cancels, and focus returns to whatever opened it
     - labelled as a dialog with the correct role so assistive technology
       reads the title rather than an unlabelled box
     - colours and icons come from the existing shared icon library and
       the shared theme tokens, not from a new design system
   ============================================================ */

import { iconLogout } from '../icons/icons.js';

let root = null;
let dialog = null;
let lastFocused = null;
let resolveCurrent = null;
let confirmHandler = null;

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function buildRoot() {
  const host = document.createElement('div');
  host.id = 'shared-modal-root';
  host.className = 'modal-root';
  host.hidden = true;
  host.innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop></div>
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shared-modal-title"
      aria-describedby="shared-modal-message"
      tabindex="-1"
    >
      <div class="modal__icon" data-modal-icon aria-hidden="true"></div>
      <h2 class="modal__title" id="shared-modal-title"></h2>
      <p class="modal__message" id="shared-modal-message"></p>
      <div class="modal__actions">
        <button type="button" class="modal__btn modal__btn--ghost" data-modal-cancel></button>
        <button type="button" class="modal__btn modal__btn--danger" data-modal-confirm></button>
      </div>
    </div>`;
  document.body.appendChild(host);

  host.querySelector('[data-modal-backdrop]').addEventListener('click', () => {
    // A stray click on the scrim is treated as "no".
    closeModal(false);
  });
  host.querySelector('[data-modal-cancel]').addEventListener('click', () => closeModal(false));
  host.querySelector('[data-modal-confirm]').addEventListener('click', () => {
    // Close first so the dialog is already gone while an async handler runs,
    // then resolve with the confirmed outcome.
    closeModal(true);
    const run = confirmHandler;
    confirmHandler = null;
    run?.();
  });

  return host;
}

/**
 * Ask a yes/no question.
 *
 * @param {Object} options
 * @param {string} options.title
 * @param {string} [options.message]
 * @param {string} [options.confirmLabel]
 * @param {string} [options.cancelLabel]
 * @param {'danger'|'primary'} [options.variant]
 * @param {string} [options.icon] - markup for the leading icon
 * @param {() => void} [options.onConfirm]
 * @returns {Promise<boolean>} whether the user confirmed
 */
export function openModal({
  title,
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  icon = '',
  onConfirm,
} = {}) {
  if (!root) root = buildRoot();
  dialog = root.querySelector('.modal');

  // An already-open dialog is resolved as cancelled rather than orphaned.
  if (!root.hidden) closeModal(false);

  lastFocused = document.activeElement;
  confirmHandler = onConfirm ?? null;

  root.querySelector('.modal__title').textContent = title ?? '';
  root.querySelector('.modal__message').textContent = message;
  const messageEl = root.querySelector('.modal__message');
  messageEl.hidden = !message;
  root.querySelector('[data-modal-icon]').innerHTML = icon;

  const confirmBtn = root.querySelector('[data-modal-confirm]');
  const cancelBtn = root.querySelector('[data-modal-cancel]');
  confirmBtn.textContent = confirmLabel;
  cancelBtn.textContent = cancelLabel;

  dialog.classList.toggle('modal--danger', variant === 'danger');
  confirmBtn.classList.toggle('modal__btn--danger', variant === 'danger');
  confirmBtn.classList.toggle('modal__btn--primary', variant !== 'danger');

  root.hidden = false;
  document.body.classList.add('modal-open');
  // Focus the cancel action: the destructive choice must not be the one a
  // stray Enter press lands on.
  cancelBtn.focus();

  return new Promise((resolve) => {
    resolveCurrent = resolve;
  });
}

function closeModal(result) {
  if (!root || root.hidden) return;
  root.hidden = true;
  document.body.classList.remove('modal-open');

  const resolve = resolveCurrent;
  resolveCurrent = null;
  confirmHandler = null;

  // Return focus where it came from, so keyboard users are not dropped
  // at the top of the document.
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  lastFocused = null;

  resolve?.(result);
}

/** Close the open dialog with an explicit outcome. */
export function closeModalWith(result) {
  closeModal(result);
}

document.addEventListener('keydown', (event) => {
  if (!root || root.hidden) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal(false);
    return;
  }

  if (event.key !== 'Tab') return;

  const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.offsetParent !== null,
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  // Wrap within the dialog: Tab must not reach the page behind it.
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (!dialog.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
  }
});

/**
 * Confirmation for signing out.
 *
 * Sharing this means the navbar's account menu and the Homepage's own
 * header control cannot drift apart in wording, focus behaviour or styling.
 *
 * @param {Object} [options]
 * @param {() => void|Promise<void>} options.onConfirm - runs after confirming
 * @param {string} [options.name] - shown in the prompt when known
 * @returns {Promise<boolean>}
 */
export function confirmLogout({ onConfirm, name = '' } = {}) {
  return openModal({
    title: 'Log out?',
    message: name
      ? `You'll be signed out of EasyDeal as ${name}. Anything you've saved stays on your account.`
      : "You'll be signed out of EasyDeal. Anything you've saved stays on your account.",
    confirmLabel: 'Log out',
    cancelLabel: 'Stay signed in',
    variant: 'danger',
    icon: iconLogout({ size: 24 }),
    onConfirm,
  });
}