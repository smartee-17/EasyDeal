/* ============================================================
   EASYDEAL — MODAL COMPONENT
   Purpose: Reusable modal / confirmation dialogs
   ============================================================ */

import { iconClose, iconWarning, iconInfo, iconCheck } from '../icons/icons.js';

let activeModal = null;
let activeBackdrop = null;

export function openModal(options = {}) {
  closeModal();

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
  } = options;

  activeBackdrop = document.createElement('div');
  activeBackdrop.className = 'modal-backdrop is-visible';
  activeBackdrop.setAttribute('role', 'dialog');
  activeBackdrop.setAttribute('aria-modal', 'true');
  activeBackdrop.setAttribute('aria-label', title);

  const iconHtml = getIconHtml(icon);
  const bodyHtml = content || `<p class="modal__text">${escapeHtml(message)}</p>`;

  activeBackdrop.innerHTML = `
    <div class="modal">
      <div class="modal__header">
        <span class="modal__icon modal__icon--${danger ? 'danger' : icon === 'warning' ? 'warning' : 'info'}">${iconHtml}</span>
        <div>
          <h3 class="modal__title">${escapeHtml(title)}</h3>
        </div>
      </div>
      <div class="modal__body">
        ${bodyHtml}
      </div>
      <div class="modal__actions">
        ${showCancel ? `<button type="button" class="btn btn--ghost modal__cancel">${escapeHtml(cancelText)}</button>` : ''}
        <button type="button" class="btn ${danger ? 'btn--primary' : 'btn--primary'} modal__confirm">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(activeBackdrop);
  document.body.style.overflow = 'hidden';

  const confirmBtn = activeBackdrop.querySelector('.modal__confirm');
  const cancelBtn = activeBackdrop.querySelector('.modal__cancel');

  function handleConfirm() {
    closeModal();
    if (onConfirm) onConfirm();
  }

  function handleCancel() {
    closeModal();
    if (onCancel) onCancel();
  }

  confirmBtn.addEventListener('click', handleConfirm);
  if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);

  activeBackdrop.addEventListener('click', (e) => {
    if (e.target === activeBackdrop) handleCancel();
  });

  const handleKey = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };
  document.addEventListener('keydown', handleKey);
  activeModal = { backdrop: activeBackdrop, handleKey };
}

export function closeModal() {
  if (!activeModal) return;
  document.removeEventListener('keydown', activeModal.handleKey);
  if (activeModal.backdrop) {
    activeModal.backdrop.classList.remove('is-visible');
    setTimeout(() => {
      activeModal.backdrop?.remove();
      if (!document.querySelector('.modal-backdrop')) {
        document.body.style.overflow = '';
      }
    }, 200);
  }
  activeModal = null;
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
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}