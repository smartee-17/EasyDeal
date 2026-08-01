/* ============================================================
   EASYDEAL — AUTHENTICATION SERVICE
   Purpose: Login, logout, auth state, profile, guards
   Backend: Cookie-based auth (HTTP-only cookie)
   ============================================================ */

import { buildUrl, defaultFetchOptions } from './apiConfig.js';

export async function login({ emailOrUsername, password, rememberMe = false }) {
  try {
    const response = await fetch(buildUrl('/auth/login'), {
      ...defaultFetchOptions,
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password, rememberMe }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Login failed. Please check your credentials.',
      };
    }

    if (result.data?.user) {
      setUser(result.data.user);
    }

    return { success: true, data: result.data, message: result.message };
  } catch (error) {
    console.error('[AuthService] login error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

export async function logout() {
  try {
    const response = await fetch(buildUrl('/auth/logout'), {
      ...defaultFetchOptions,
      method: 'POST',
    });
    const result = await response.json();
    clearAuthState();
    return { success: response.ok, message: result.message || 'Logged out successfully' };
  } catch (error) {
    console.error('[AuthService] logout error:', error);
    clearAuthState();
    return { success: true, message: 'Logged out locally.' };
  }
}

export async function getMe() {
  console.log("Calling /user/me");

  try {
    const response = await fetch(buildUrl('/user/me'), {
      ...defaultFetchOptions,
      method: 'GET',
    });

    console.log("Status:", response.status);

    const result = await response.json();

    console.log(result);

    if (!response.ok) {
      return { success: false, message: result.message || 'Not authenticated' };
    }
    if (result.data?.user) {
      setUser(result.data.user);
    }
    return { success: true, data: result.data };
  } catch (error) {
    console.error('[AuthService] getMe error:', error);
    return { success: false, message: 'Network error' };
  }
}

export function isAuthenticated() {
  return !!getUser();
}

export function getUser() {
  try {
    const raw = sessionStorage.getItem('easydeal-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  sessionStorage.setItem('easydeal-user', JSON.stringify(user));
}

export function clearAuthState() {
  sessionStorage.removeItem('easydeal-user');
}

export function isAdmin() {
  const user = getUser();
  return user?.role === 'admin';
}

export function redirectToLogin() {
  window.location.href = '../login/login.html';
}

export function redirectToDashboard() {
  window.location.href = '../dashboard/dashboard.html';
}

export async function initAuthGuard() {
  const result = await getMe();
  if (!result.success) {    
    clearAuthState();
    redirectToLogin();
    return false;
  }
  const user = result.data?.user;
  if (!user || user.role !== 'admin') {
    clearAuthState();
    redirectToLogin();
    return false;
  }
  return true;
}