/* ============================================================
   EASYDEAL — MODAL COMPONENT
   Purpose: Unified modal factory for all modal types
   ============================================================ */

import { iconClose, iconWarning, iconInfo, iconCheck } from '../icons/icons.js';

let activeModals = [];
let resizeTimeout = null;

function getActiveModals() {
  return activeModals.filter(m => m && m.element && m.element.isConnected);
}

function hasActiveModals() {
  return getActiveModals().length > 0;
}

export function updateBodyScrollLock() {
  if (hasActiveModals()) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function removeModalFromStack(modalInstance) {
  const idx = activeModals.indexOf(modalInstance);
  if (idx !== -1) {
    activeModals.splice(idx, 1);
  }
}

function getIconHtml(type) {
  switch (type) {
    case 'warning': return iconWarning({ size: 24 });
    case 'success': return iconCheck({ size: 24 });
    case 'danger': return iconWarning({ size: 24 });
    default: return iconInfo({ size: 24 });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function createBaseModal(options) {
  const {
    title = '',
    content = '',
    icon = 'info',
    size = 'default',
    showClose = true,
    closeText = 'Close',
    onClose = null,
    className = '',
  } = options;

  const backdrop = document.createElement('div');
  backdrop.className = `modal-backdrop ${className} is-visible`;
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', title);

  const sizeClasses = {
    default: 'modal',
    large: 'modal modal--large',
    full: 'modal modal--full',
  };

  const iconHtml = getIconHtml(icon);

  backdrop.innerHTML = `
    <div class="${sizeClasses[size] || sizeClasses.default}">
      <div class="modal__header">
        ${icon ? `<span class="modal__icon modal__icon--${icon}">${iconHtml}</span>` : ''}
        <div>
          <h3 class="modal__title">${escapeHtml(title)}</h3>
        </div>
        ${showClose ? `<button type="button" class="modal__close-btn" aria-label="Close">${iconClose({ size: 20 })}</button>` : ''}
      </div>
      <div class="modal__content">
        ${content}
      </div>
    </div>
  `;

  const closeBtn = backdrop.querySelector('.modal__close-btn');
  const modalEl = backdrop.querySelector('.modal');

  function close() {
    if (!instance.element.isConnected) return;
    instance.element.classList.remove('is-visible');
    instance.abortController.abort();

    const cleanup = () => {
      instance.element.remove();
      removeModalFromStack(instance);
      updateBodyScrollLock();
      if (instance.onClose) instance.onClose();
    };

    setTimeout(cleanup, 200);
  }

  const instance = {
    element: backdrop,
    modalEl,
    closeBtn,
    onClose,
    abortController: new AbortController(),
    close,
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', close, { signal: instance.abortController.signal });
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  }, { signal: instance.abortController.signal });

  const handleKey = (e) => {
    if (e.key === 'Escape') {
      close();
    }
  };
  document.addEventListener('keydown', handleKey, { signal: instance.abortController.signal });

  document.body.appendChild(backdrop);
  activeModals.push(instance);
  updateBodyScrollLock();

  return instance;
}

export function openModal(options = {}) {
  const {
    title = '',
    message = '',
    content = '',
    icon = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showCancel = true,
    danger = false,
    onConfirm = null,
    onCancel = null,
    size = 'default',
  } = options;

  const bodyHtml = content || `<p class="modal__text">${escapeHtml(message)}</p>`;
  const confirmType = danger ? 'btn--primary' : 'btn--primary';

  const instance = createBaseModal({
    title,
    content: bodyHtml,
    icon: danger ? 'danger' : icon,
    size,
    showClose: true,
    className: 'modal-backdrop--confirm',
  });

  const actions = document.createElement('div');
  actions.className = 'modal__actions';
  actions.innerHTML = `
    ${showCancel ? `<button type="button" class="btn btn--ghost modal__cancel">${escapeHtml(cancelText)}</button>` : ''}
    <button type="button" class="btn ${confirmType} modal__confirm">${escapeHtml(confirmText)}</button>
  `;

  const contentEl = instance.modalEl.querySelector('.modal__content');
  contentEl.insertAdjacentElement('afterend', actions);

  const confirmBtn = actions.querySelector('.modal__confirm');
  const cancelBtn = actions.querySelector('.modal__cancel');

  function handleConfirm() {
    instance.close();
    if (onConfirm) onConfirm();
  }

  function handleCancel() {
    instance.close();
    if (onCancel) onCancel();
  }

  confirmBtn.addEventListener('click', handleConfirm, { signal: instance.abortController.signal });
  if (cancelBtn) {
    cancelBtn.addEventListener('click', handleCancel, { signal: instance.abortController.signal });
  }

  return instance;
}

export function closeModal() {
  const modals = getActiveModals();
  modals.forEach(m => m.close());
}

export function openConfirmModal(options = {}) {
  return openModal({ ...options, className: 'modal-backdrop--confirm' });
}

export function openInfoModal(options = {}) {
  return openModal({ ...options, showCancel: false, className: 'modal-backdrop--info' });
}

export function openCustomModal(options = {}) {
  return createBaseModal(options);
}


function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateBodyScrollLock();
  }, 150);
}

window.addEventListener('resize', handleResize, { passive: true });