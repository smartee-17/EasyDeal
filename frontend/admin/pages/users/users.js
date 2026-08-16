/* ============================================================
   EASYDEAL — USERS PAGE JS
   Purpose: User listing, details modal, block/unblock/delete/restore
   ============================================================ */

import { initTheme } from '../../utils/theme.js';
import { initNavbar } from '../../components/navbar/navbar.js';
import { initSidebar } from '../../components/sidebar/sidebar.js';
import { initFooter } from '../../components/footer/footer.js';
import { showToast } from '../../components/toast/toast.js';
import { openModal, closeModal } from '../../components/modal/modal.js';
import { initAuthGuard } from '../../services/authService.js';
import { getAllUsers, getSingleUser, blockUser, unblockUser, deleteUser, restoreUser } from '../../services/dashboardService.js';
import { iconEye, iconLock, iconUnlock, iconTrash2, iconRotateCcw } from '../../components/icons/icons.js';

initTheme();
initNavbar({ context: 'admin', searchPlaceholder: 'Search users...' });
initSidebar();
initFooter();

const tableBody = document.getElementById('usersTableBody');
const emptyState = document.getElementById('usersEmpty');
let allUsers = [];

async function loadUsers() {
  const authed = await initAuthGuard();
  if (!authed) return;

  try {
    const response = await getAllUsers();
    allUsers = response.data?.users || [];
    renderUsers(allUsers);
  } catch (error) {
    console.error('[Users] load error:', error);
    showToast({ type: 'error', title: 'Failed to load', message: error.message || 'Could not fetch users.' });
    renderUsers([]);
  }
}

function renderUsers(users) {
  if (!users || users.length === 0) {
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tableBody.innerHTML = users.map(u => {
    const id = u._id || u.id;
    const isBlocked = u.isBlocked;
    const isDeleted = u.isDeleted;
    return `
      <tr data-id="${id}">
        <td class="data-table__cell">${escapeHtml(u.name || '—')}</td>
        <td class="data-table__cell">${escapeHtml(u.email || '—')}</td>
        <td class="data-table__cell"><span class="status-badge status-badge--active">${escapeHtml(u.role || 'user')}</span></td>
        <td class="data-table__cell">${isBlocked ? '<span class="status-badge status-badge--blocked">Blocked</span>' : '<span class="status-badge status-badge--active">Active</span>'}</td>
        <td class="data-table__cell">${isDeleted ? '<span class="status-badge status-badge--deleted">Deleted</span>' : '<span class="status-badge status-badge--active">Active</span>'}</td>
        <td class="data-table__cell">${formatDate(u.createdAt)}</td>
        <td class="data-table__cell">
          <div class="table-actions">
            <button type="button" class="table-actions__btn" data-action="view" data-id="${id}" aria-label="View user">
              ${iconEye({ size: 16 })}
            </button>
            ${!isDeleted ? `
              ${!isBlocked ? `
                <button type="button" class="table-actions__btn table-actions__btn--warning" data-action="block" data-id="${id}" aria-label="Block user">
                  ${iconLock({ size: 16 })}
                </button>
              ` : `
                <button type="button" class="table-actions__btn" data-action="unblock" data-id="${id}" aria-label="Unblock user">
                  ${iconUnlock({ size: 16 })}
                </button>
              `}
              <button type="button" class="table-actions__btn table-actions__btn--danger" data-action="delete" data-id="${id}" aria-label="Delete user">
                ${iconTrash2({ size: 16 })}
              </button>
            ` : `
              <button type="button" class="table-actions__btn" data-action="restore" data-id="${id}" aria-label="Restore user">
                ${iconRotateCcw({ size: 16 })}
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => handleView(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="block"]').forEach(btn => {
    btn.addEventListener('click', () => handleBlock(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="unblock"]').forEach(btn => {
    btn.addEventListener('click', () => handleUnblock(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="restore"]').forEach(btn => {
    btn.addEventListener('click', () => handleRestore(btn.dataset.id));
  });
}

async function handleView(id) {
  try {
    const response = await getSingleUser(id);
    const u = response.data?.user;
    if (!u) {
      showToast({ type: 'error', title: 'Not found', message: 'User not found.' });
      return;
    }

    openModal({
      title: 'User Details',
      icon: 'info',
      showCancel: false,
      confirmText: 'Close',
      content: `
        <div class="modal__details-row">
          <span class="modal__details-label">Name</span>
          <span class="modal__details-value">${escapeHtml(u.name || '—')}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Email</span>
          <span class="modal__details-value">${escapeHtml(u.email || '—')}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Role</span>
          <span class="modal__details-value">${escapeHtml(u.role || 'user')}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Status</span>
          <span class="modal__details-value">${u.isBlocked ? 'Blocked' : 'Active'}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Deleted</span>
          <span class="modal__details-value">${u.isDeleted ? 'Yes' : 'No'}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Email Verified</span>
          <span class="modal__details-value">${u.isEmailVerified ? 'Yes' : 'No'}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Created</span>
          <span class="modal__details-value">${formatDate(u.createdAt)}</span>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Users] view error:', error);
    showToast({ type: 'error', title: 'Error', message: error.message || 'Could not load user details.' });
  }
}

function handleBlock(id) {
  const user = allUsers.find(u => (u._id || u.id) === id);
  const name = user?.name || 'this user';

  openModal({
    title: 'Block User?',
    message: `Are you sure you want to block "${name}"? They will no longer be able to log in.`,
    icon: 'warning',
    danger: true,
    confirmText: 'Block',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await blockUser(id);
        showToast({ type: 'success', title: 'Blocked', message: `"${name}" has been blocked.` });
        await reloadUser(id);
      } catch (error) {
        console.error('[Users] block error:', error);
        showToast({ type: 'error', title: 'Block failed', message: error.message || 'Could not block user.' });
      }
    },
  });
}

function handleUnblock(id) {
  const user = allUsers.find(u => (u._id || u.id) === id);
  const name = user?.name || 'this user';

  openModal({
    title: 'Unblock User?',
    message: `Are you sure you want to unblock "${name}"? They will be able to log in again.`,
    icon: 'warning',
    confirmText: 'Unblock',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await unblockUser(id);
        showToast({ type: 'success', title: 'Unblocked', message: `"${name}" has been unblocked.` });
        await reloadUser(id);
      } catch (error) {
        console.error('[Users] unblock error:', error);
        showToast({ type: 'error', title: 'Unblock failed', message: error.message || 'Could not unblock user.' });
      }
    },
  });
}

function handleDelete(id) {
  const user = allUsers.find(u => (u._id || u.id) === id);
  const name = user?.name || 'this user';

  openModal({
    title: 'Delete User?',
    message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    icon: 'warning',
    danger: true,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await deleteUser(id);
        showToast({ type: 'success', title: 'Deleted', message: `"${name}" has been deleted.` });
        await reloadUser(id);
      } catch (error) {
        console.error('[Users] delete error:', error);
        showToast({ type: 'error', title: 'Delete failed', message: error.message || 'Could not delete user.' });
      }
    },
  });
}

function handleRestore(id) {
  const user = allUsers.find(u => (u._id || u.id) === id);
  const name = user?.name || 'this user';

  openModal({
    title: 'Restore User?',
    message: `Are you sure you want to restore "${name}"?`,
    icon: 'warning',
    confirmText: 'Restore',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await restoreUser(id);
        showToast({ type: 'success', title: 'Restored', message: `"${name}" has been restored.` });
        await reloadUser(id);
      } catch (error) {
        console.error('[Users] restore error:', error);
        showToast({ type: 'error', title: 'Restore failed', message: error.message || 'Could not restore user.' });
      }
    },
  });
}

async function reloadUser(id) {
  try {
    const response = await getSingleUser(id);
    const updated = response.data?.user;
    if (updated) {
      const idx = allUsers.findIndex(u => (u._id || u.id) === id);
      if (idx !== -1) {
        allUsers[idx] = updated;
        renderUsers(allUsers);
      }
    }
  } catch (error) {
    console.error('[Users] reload error:', error);
    loadUsers();
  }
}

function escapeHtml(str) {
  if (!str) return '—';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

loadUsers();