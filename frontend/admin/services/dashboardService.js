/* ============================================================
   EASYDEAL — DASHBOARD SERVICE
   Purpose: Centralized admin backend communication
   ============================================================ */

import { buildUrl, defaultFetchOptions } from './apiConfig.js';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function getDashboardStats() {
  const response = await fetch(buildUrl('/admin/dashboard/stats'), {
    ...defaultFetchOptions,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function getAllProducts() {
  const response = await fetch(buildUrl('/admin/products'), {
    ...defaultFetchOptions,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function getSingleProduct(id) {
  const response = await fetch(buildUrl(`/admin/products/${id}`), {
    ...defaultFetchOptions,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function deleteProduct(id) {
  const response = await fetch(buildUrl(`/admin/products/${id}`), {
    ...defaultFetchOptions,
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function getProductFull(id) {
  const response = await fetch(buildUrl(`/products/${id}`), {
    ...defaultFetchOptions,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function updateProduct(id, formData) {
  const headers = {};
  if (formData instanceof FormData) {
    // Do not set Content-Type — browser sets it with boundary for multipart
  } else {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(buildUrl(`/products/${id}`), {
    credentials: 'include',
    headers,
    method: 'PUT',
    body: formData,
  });
  return handleResponse(response);
}

export async function getAllUsers() {
  const response = await fetch(buildUrl('/admin/users'), {
    ...defaultFetchOptions,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function getSingleUser(id) {
  const response = await fetch(buildUrl(`/admin/users/${id}`), {
    ...defaultFetchOptions,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function blockUser(id) {
  const response = await fetch(buildUrl(`/admin/users/${id}/block`), {
    ...defaultFetchOptions,
    method: 'PATCH',
  });
  return handleResponse(response);
}

export async function unblockUser(id) {
  const response = await fetch(buildUrl(`/admin/users/${id}/unblock`), {
    ...defaultFetchOptions,
    method: 'PATCH',
  });
  return handleResponse(response);
}

export async function deleteUser(id) {
  const response = await fetch(buildUrl(`/admin/users/${id}/delete`), {
    ...defaultFetchOptions,
    method: 'PATCH',
  });
  return handleResponse(response);
}

export async function restoreUser(id) {
  const response = await fetch(buildUrl(`/admin/users/${id}/restore`), {
    ...defaultFetchOptions,
    method: 'PATCH',
  });
  return handleResponse(response);
}

export async function searchProducts(query) {
  const response = await fetch(buildUrl(`/admin/products/search?search=${encodeURIComponent(query)}`), {
    ...defaultFetchOptions,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function searchUsers(query) {
  const response = await fetch(buildUrl(`/admin/users/search?search=${encodeURIComponent(query)}`), {
    ...defaultFetchOptions,
    method: 'GET',
  });
  return handleResponse(response);
}