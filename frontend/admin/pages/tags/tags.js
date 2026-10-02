/* ============================================================
   EASYDEAL — TAGS PAGE JS
   Purpose: Tag listing, add / details / edit flows
   ============================================================ */

import { initTheme } from '../../utils/theme.js';
import { initNavbar } from '../../components/navbar/navbar.js';
import { initSidebar } from '../../components/sidebar/sidebar.js';
import { initFooter } from '../../components/footer/footer.js';
import { showToast } from '../../components/toast/toast.js';
import { openModal, openCustomModal } from '../../components/modal/modal.js';
import { initAuthGuard } from '../../services/authService.js';
import { getAllTags, createTag, updateTag, deleteTag } from '../../services/dashboardService.js';
import { iconEye, iconEdit, iconTrash2, iconChevronUp, iconChevronDown } from '../../components/icons/icons.js';

initTheme();

// Navbar search is present for shell parity with the other admin pages;
// table-specific search is handled by the toolbar search input below.
initNavbar({ context: 'admin', searchPlaceholder: 'Search tags...' });
initSidebar();
initFooter();

// Page-local, matching the escaping helper used by the other admin pages.
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const tableBody = document.getElementById('tagsTableBody');
const tagsTable = document.getElementById('tagsTable');
const emptyState = document.getElementById('tagsEmpty');
const noResultsState = document.getElementById('tagsNoResults');
const countLabel = document.getElementById('tagsCount');
const addTagBtn = document.getElementById('addTagBtn');
const searchInput = document.getElementById('tagsSearchInput');
const searchClear = document.getElementById('tagsSearchClear');
const clearSearchBtn = document.getElementById('tagsClearSearchBtn');
const paginationControls = document.getElementById('tagsPaginationControls');
const paginationLabel = document.getElementById('tagsPaginationLabel');
const paginationEl = document.getElementById('tagsPagination');
const sortHeaders = document.querySelectorAll('.data-table__th.sortable');
const sortIcons = document.querySelectorAll('.data-table__sort-icon');

let allTags = [];
let searchQuery = '';
let sortState = { key: null, direction: 'asc' };
let currentPage = 1;
const pageSize = 10;

function clearSkeleton() {
  tableBody.querySelectorAll('tr.skeleton-row').forEach(row => row.remove());
}

async function loadTags() {
  const authed = await initAuthGuard();
  if (!authed) {
    clearSkeleton();
    return;
  }

  try {
    const response = await getAllTags();
    // GET /api/tags returns the tag array directly as `data`.
    allTags = Array.isArray(response?.data) ? response.data : [];
    clearSkeleton();
    applyFiltersAndRender();
  } catch (error) {
    console.error('[Tags] load error:', error);
    showToast({ type: 'error', title: 'Failed to load', message: error.message || 'Could not fetch tags.' });
    clearSkeleton();
    applyFiltersAndRender();
  }
}

function getFilteredTags() {
  if (!searchQuery.trim()) return allTags;
  const query = searchQuery.trim().toLowerCase();
  return allTags.filter(tag => {
    const name = (tag.name || '').toLowerCase();
    const slug = (tag.slug || '').toLowerCase();
    return name.includes(query) || slug.includes(query);
  });
}

function getSortedTags(tags) {
  if (!sortState.key) return tags;
  const { key, direction } = sortState;
  return [...tags].sort((a, b) => {
    let aVal, bVal;
    switch (key) {
      case 'name':
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
        break;
      case 'slug':
        aVal = (a.slug || '').toLowerCase();
        bVal = (b.slug || '').toLowerCase();
        break;
      case 'createdAt':
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        break;
      case 'updatedAt':
        aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        break;
      case 'createdBy':
      case 'updatedBy':
        aVal = String(a[key] || '');
        bVal = String(b[key] || '');
        break;
      default:
        return 0;
    }
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function getPaginatedTags(tags) {
  const start = (currentPage - 1) * pageSize;
  return tags.slice(start, start + pageSize);
}

function applyFiltersAndRender() {
  const filtered = getFilteredTags();
  const sorted = getSortedTags(filtered);
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const paginated = getPaginatedTags(sorted);
  
  renderTags(paginated, sorted.length, allTags.length);
  updatePagination(totalPages, sorted.length);
  updateSortIndicators();
}

function getTagId(tag) {
  return tag?._id || tag?.id;
}

function findTag(id) {
  return allTags.find(t => getTagId(t) === id);
}

function renderTags(tags, filteredCount, totalCount) {
  // Hide both empty states first
  emptyState.classList.add('hidden');
  noResultsState.classList.add('hidden');
  paginationEl.classList.add('hidden');
  
  if (!tags || tags.length === 0) {
    tableBody.innerHTML = '';
    tagsTable.classList.remove('has-data');
    
    if (searchQuery.trim()) {
      noResultsState.classList.remove('hidden');
    } else {
      emptyState.classList.remove('hidden');
    }
    
    if (countLabel) {
      if (searchQuery.trim()) {
        countLabel.textContent = `0 of ${totalCount} ${totalCount === 1 ? 'tag' : 'tags'}`;
      } else {
        countLabel.textContent = '';
      }
    }
    return;
  }

  tagsTable.classList.add('has-data');
  paginationEl.classList.remove('hidden');
  
  if (countLabel) {
    if (searchQuery.trim()) {
      countLabel.textContent = `${filteredCount} of ${totalCount} ${totalCount === 1 ? 'tag' : 'tags'}`;
    } else {
      countLabel.textContent = `${tags.length} ${tags.length === 1 ? 'tag' : 'tags'}`;
    }
  }

  tableBody.innerHTML = tags.map(tag => {
    const id = getTagId(tag);
    const tagName = tag.name || '—';
    // The backend owns slug generation; render the stored value as-is.
    const tagSlug = tag.slug || '—';
    return `
      <tr data-id="${id}">
        <td class="data-table__cell" data-label="Tag"><span class="tag-badge">${escapeHtml(tagName)}</span></td>
        <td class="data-table__cell" data-label="Slug"><span class="tag-slug" title="${escapeHtml(tagSlug)}">${escapeHtml(tagSlug)}</span></td>
        <td class="data-table__cell" data-label="Created By">${formatAdminId(tag.createdBy)}</td>
        <td class="data-table__cell" data-label="Created">${formatDate(tag.createdAt)}</td>
        <td class="data-table__cell" data-label="Updated By">${formatAdminId(tag.updatedBy)}</td>
        <td class="data-table__cell" data-label="Updated">${formatDate(tag.updatedAt)}</td>
        <td class="data-table__cell" data-label="Actions">
          <div class="table-actions">
            <button type="button" class="table-actions__btn" data-action="view" data-id="${id}" aria-label="View tag details" title="View details">
              ${iconEye({ size: 16 })}
            </button>
            <button type="button" class="table-actions__btn" data-action="edit" data-id="${id}" aria-label="Edit tag" title="Edit">
              ${iconEdit({ size: 16 })}
            </button>
            <button type="button" class="table-actions__btn table-actions__btn--danger" data-action="delete" data-id="${id}" aria-label="Delete tag" title="Delete">
              ${iconTrash2({ size: 16 })}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => openTagDetailsModal(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => openEditTagModal(btn.dataset.id));
  });
  tableBody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
}

function updatePagination(totalPages, filteredCount) {
  if (totalPages <= 1) {
    paginationControls.innerHTML = '';
    if (paginationLabel) paginationLabel.textContent = '';
    return;
  }
  
  if (paginationLabel) {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filteredCount);
    paginationLabel.textContent = `Showing ${start}–${end} of ${filteredCount} ${filteredCount === 1 ? 'tag' : 'tags'}`;
  }
  
  let html = '';
  
  // Previous button
  html += `<button type="button" class="tags-pagination__btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  </button>`;
  
  // Page numbers
  const pages = getPageNumbers(currentPage, totalPages);
  pages.forEach(page => {
    if (page === '...') {
      html += `<span class="tags-pagination__ellipsis" aria-hidden="true">…</span>`;
    } else {
      html += `<button type="button" class="tags-pagination__btn ${page === currentPage ? 'tags-pagination__btn--active' : ''}" data-page="${page}" aria-label="Page ${page}" ${page === currentPage ? 'aria-current="page"' : ''}>${page}</button>`;
    }
  });
  
  // Next button
  html += `<button type="button" class="tags-pagination__btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </button>`;
  
  paginationControls.innerHTML = html;
  
  paginationControls.querySelectorAll('.tags-pagination__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page === 'prev') {
        if (currentPage > 1) {
          currentPage--;
          applyFiltersAndRender();
        }
      } else if (page === 'next') {
        if (currentPage < totalPages) {
          currentPage++;
          applyFiltersAndRender();
        }
      } else {
        const pageNum = parseInt(page, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          currentPage = pageNum;
          applyFiltersAndRender();
        }
      }
    });
  });
}

function getPageNumbers(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  const pages = [];
  pages.push(1);
  
  if (current > 3) {
    pages.push('...');
  }
  
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  if (current < total - 2) {
    pages.push('...');
  }
  
  pages.push(total);
  return pages;
}

function updateSortIndicators() {
  sortHeaders.forEach(th => {
    const sortKey = th.dataset.sortKey;
    const iconEl = th.querySelector('.data-table__sort-icon');
    if (!iconEl) return;
    
    if (sortState.key === sortKey) {
      th.classList.add('sorted');
      th.setAttribute('aria-sort', sortState.direction === 'asc' ? 'ascending' : 'descending');
      iconEl.innerHTML = sortState.direction === 'asc' 
        ? iconChevronUp({ size: 12 }) 
        : iconChevronDown({ size: 12 });
    } else {
      th.classList.remove('sorted');
      th.setAttribute('aria-sort', 'none');
      iconEl.innerHTML = '';
    }
  });
}

/* ── Inline field validation ──────────────────────────────────
   Mirrors the login page's showFieldError / clearFieldErrors
   approach so field-level errors reuse the global .form-error and
   .form-input--error primitives. */
function showFieldError(input, message) {
  input.classList.add('form-input--error');
  input.setAttribute('aria-invalid', 'true');
  let errorEl = input.parentElement.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    errorEl.id = `${input.id}Error`;
    input.setAttribute('aria-describedby', errorEl.id);
    input.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

function clearFieldErrors(modal) {
  modal.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));
  modal.querySelectorAll('.form-error').forEach(el => el.remove());
  const input = modal.querySelector('.tags-modal__input');
  if (input) input.removeAttribute('aria-invalid');
}

/* ── Add Tag ──────────────────────────────────────────────────
   Builds a fresh form on every open, so no state can leak between
   sessions. openCustomModal is used rather than openModal because
   openModal closes the modal before invoking onConfirm, which would
   make it impossible to keep the form open on a validation error. */
function openAddTagModal() {
  const content = `
    <div class="tags-modal">
      <div class="tags-modal__body">
        <div class="tags-modal__field">
          <label class="form-label" for="addTagName">Tag Name <span class="tags-modal__required" aria-hidden="true">*</span></label>
          <input type="text" id="addTagName" class="form-input tags-modal__input" placeholder="Enter tag name" autocomplete="off" />
        </div>
      </div>
      <div class="tags-modal__footer">
        <button type="button" class="btn btn--ghost tags-modal__cancel">Cancel</button>
        <button type="button" class="btn btn--primary tags-modal__submit">Add Tag</button>
      </div>
    </div>
  `;

  const instance = openCustomModal({
    title: 'Add Tag',
    content,
    icon: '',
    size: 'default',
    showClose: true,
    className: 'tags-modal-backdrop',
  });

  const modal = instance.element;
  const nameInput = modal.querySelector('#addTagName');
  const submitBtn = modal.querySelector('.tags-modal__submit');

  modal.querySelector('.tags-modal__cancel').addEventListener('click', () => instance.close(), {
    signal: instance.abortController.signal,
  });

  // Re-validate on typing so the error clears as soon as the user types.
  nameInput.addEventListener('input', () => clearFieldErrors(modal), {
    signal: instance.abortController.signal,
  });

  async function submit() {
    clearFieldErrors(modal);
    const name = nameInput.value.trim();

    if (!name) {
      showFieldError(nameInput, 'Tag name is required.');
      nameInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

try {
        const response = await createTag(name);
        const created = response.data;
        instance.close();

        if (created) {
          allTags = [...allTags.filter(t => getTagId(t) !== getTagId(created)), created];
          // Keep the alphabetical order the API returns.
          allTags.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else {
          await loadTags();
        }
        applyFiltersAndRender();

        showToast({ type: 'success', title: 'Created', message: response.message || `"${name}" has been created.` });
      } catch (error) {
        console.error('[Tags] create error:', error);
        showToast({ type: 'error', title: 'Create failed', message: error.message || 'Could not create tag.' });
        // Restore the button so the modal stays usable.
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Tag';
      }
    }

  submitBtn.addEventListener('click', submit, { signal: instance.abortController.signal });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }, { signal: instance.abortController.signal });

  nameInput.focus();
}

/* ── Edit Tag ────────────────────────────────────────────────
   Uses the tag already held in page state; no extra GET is made. */
function openEditTagModal(id) {
  const tag = findTag(id);
  if (!tag) {
    showToast({ type: 'error', title: 'Not found', message: 'Tag not found.' });
    return;
  }

  const currentName = tag.name || '';
  const currentSlug = tag.slug || '';

  const content = `
    <div class="tags-modal">
      <div class="tags-modal__body">
        <div class="tags-modal__field">
          <label class="form-label" for="editTagName">Tag Name <span class="tags-modal__required" aria-hidden="true">*</span></label>
          <input type="text" id="editTagName" class="form-input tags-modal__input" value="${escapeHtml(currentName)}" autocomplete="off" />
        </div>
        <div class="tags-modal__field">
          <label class="form-label" for="editTagSlug">Slug</label>
          <input type="text" id="editTagSlug" class="form-input tags-modal__input tags-modal__input--readonly" value="${escapeHtml(currentSlug)}" readonly aria-readonly="true" tabindex="-1" />
          <p class="form-hint">Regenerated automatically from the tag name when you save.</p>
        </div>
      </div>
      <div class="tags-modal__footer">
        <button type="button" class="btn btn--ghost tags-modal__cancel">Cancel</button>
        <button type="button" class="btn btn--primary tags-modal__submit">Save Changes</button>
      </div>
    </div>
  `;

  const instance = openCustomModal({
    title: 'Edit Tag',
    content,
    icon: '',
    size: 'default',
    showClose: true,
    className: 'tags-modal-backdrop',
  });

  const modal = instance.element;
  const nameInput = modal.querySelector('#editTagName');
  const submitBtn = modal.querySelector('.tags-modal__submit');

  modal.querySelector('.tags-modal__cancel').addEventListener('click', () => instance.close(), {
    signal: instance.abortController.signal,
  });

  nameInput.addEventListener('input', () => clearFieldErrors(modal), {
    signal: instance.abortController.signal,
  });

  async function submit() {
    clearFieldErrors(modal);
    const name = nameInput.value.trim();

    if (!name) {
      showFieldError(nameInput, 'Tag name is required.');
      nameInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

try {
        const response = await updateTag(getTagId(tag), name);
        // The backend owns slug and updatedAt; take them from the response.
        const updated = response.data;
        instance.close();

        if (updated) {
          const idx = allTags.findIndex(t => getTagId(t) === getTagId(tag));
          if (idx !== -1) allTags[idx] = updated;
          allTags.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else {
          await loadTags();
        }
        applyFiltersAndRender();

        showToast({ type: 'success', title: 'Updated', message: response.message || `"${name}" has been updated.` });
      } catch (error) {
        console.error('[Tags] update error:', error);
        showToast({ type: 'error', title: 'Update failed', message: error.message || 'Could not update tag.' });
        // Keep the modal open so the value can be corrected.
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
      }
    }

  submitBtn.addEventListener('click', submit, { signal: instance.abortController.signal });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }, { signal: instance.abortController.signal });

  nameInput.focus();
  nameInput.select();
}

/* ── Tag Details ─────────────────────────────────────────────
   Read-only preview built entirely from the tag in page state, so
   opening it issues no network request. */
function openTagDetailsModal(id) {
  const tag = findTag(id);
  if (!tag) {
    showToast({ type: 'error', title: 'Not found', message: 'Tag not found.' });
    return;
  }

  const tagId = getTagId(tag);
  const tagName = tag.name || '—';
  const tagSlug = tag.slug || '—';
  const createdBy = formatAdminId(tag.createdBy);
  const updatedBy = formatAdminId(tag.updatedBy);

  const content = `
    <div class="tags-modal tags-modal--details">
      <div class="tags-modal__body">
        <div class="tags-modal__chip-wrap">
          <span class="tag-badge tags-modal__chip">${escapeHtml(tagName)}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Tag Name</span>
          <span class="modal__details-value">${escapeHtml(tagName)}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Slug</span>
          <span class="modal__details-value">${escapeHtml(tagSlug)}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Created By</span>
          <span class="modal__details-value">${createdBy}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Created</span>
          <span class="modal__details-value">${formatDate(tag.createdAt)}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Updated By</span>
          <span class="modal__details-value">${updatedBy}</span>
        </div>
        <div class="modal__details-row">
          <span class="modal__details-label">Last Updated</span>
          <span class="modal__details-value">${formatDate(tag.updatedAt)}</span>
        </div>
      </div>
      <div class="tags-modal__footer">
        <button type="button" class="btn btn--ghost tags-modal__close">Close</button>
        <button type="button" class="btn btn--outline-danger tags-modal__delete-btn">Delete Tag</button>
        <button type="button" class="btn btn--primary tags-modal__edit-btn">Edit Tag</button>
      </div>
    </div>
  `;

  const instance = openCustomModal({
    title: 'Tag Details',
    content,
    icon: '',
    size: 'default',
    showClose: true,
    className: 'tags-modal-backdrop tags-modal-backdrop--details',
  });

  instance.element.querySelector('.tags-modal__close').addEventListener('click', () => instance.close(), {
    signal: instance.abortController.signal,
  });

  // Details -> Edit: close this modal first so the two never stack.
  instance.element.querySelector('.tags-modal__edit-btn').addEventListener('click', () => {
    instance.close();
    openEditTagModal(tagId);
  }, { signal: instance.abortController.signal });

  // Details -> Delete: close this modal first, then open confirmation.
  instance.element.querySelector('.tags-modal__delete-btn').addEventListener('click', () => {
    instance.close();
    handleDelete(tagId);
  }, { signal: instance.abortController.signal });
}

function handleDelete(id) {
  const tag = findTag(id);
  const name = tag?.name || 'this tag';

  openModal({
    title: 'Delete Tag?',
    message: `Are you sure you want to delete "${name}"? This tag will be removed from products that use it.`,
    icon: 'warning',
    danger: true,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await deleteTag(id);
        showToast({ type: 'success', title: 'Deleted', message: `"${name}" has been deleted.` });
        // Remove from local state and re-render
        allTags = allTags.filter(t => getTagId(t) !== id);
        applyFiltersAndRender();
      } catch (error) {
        console.error('[Tags] delete error:', error);
        showToast({ type: 'error', title: 'Delete failed', message: error.message || 'Could not delete tag.' });
      }
    },
  });
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function formatAdminId(id) {
  if (!id) return '—';
  // Display first 8 chars of ObjectId for readability
  return String(id).slice(0, 8);
}

if (addTagBtn) {
  addTagBtn.addEventListener('click', openAddTagModal);
}

// Search input
if (searchInput) {
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    currentPage = 1;
    applyFiltersAndRender();
    
    // Show/hide clear button
    if (searchClear) {
      searchClear.classList.toggle('is-visible', !!searchInput.value);
    }
  });
}

// Clear search button
if (searchClear) {
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    currentPage = 1;
    searchClear.classList.remove('is-visible');
    searchInput.focus();
    applyFiltersAndRender();
  });
}

// Clear search from no-results state
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    currentPage = 1;
    if (searchClear) searchClear.style.display = 'none';
    applyFiltersAndRender();
  });
}

// Sort headers
sortHeaders.forEach(th => {
  const btn = th.querySelector('.data-table__sort-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const key = th.dataset.sortKey;
      if (sortState.key === key) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.key = key;
        sortState.direction = 'asc';
      }
      currentPage = 1;
      applyFiltersAndRender();
    });
  }
});

loadTags();
