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
  console.warn('[DashboardService] searchProducts() is a placeholder.');
  return { products: [] };
}

export async function searchUsers(query) {
  console.warn('[DashboardService] searchUsers() is a placeholder.');
  return { users: [] };
}