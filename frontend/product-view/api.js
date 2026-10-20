/* Product View API client.

   The base URL and fetch options come from the shared configuration, the same
   source the Homepage and the Auth pages use. This file previously pinned the
   deployed production host, which meant the page talked to production no
   matter which host it was served from: opening it locally produced a
   cross-origin request that the API refused, and the page rendered empty.

   Because the base URL is now derived from the page's own hostname, the page
   works against a local API in development and against the deployed API in
   production without either place having to be edited. */

import { buildUrl, defaultFetchOptions } from '../shared/apiConfig.js';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
    }
    throw new Error(errorMessage);
  }
  const result = await response.json();
  return result.data;
}

export async function fetchProductById(id) {
  const response = await fetch(buildUrl(`/products/${id}`), {
    ...defaultFetchOptions,
  });
  return handleResponse(response);
}

export async function fetchRelatedProducts() {
  const response = await fetch(buildUrl('/products'), {
    ...defaultFetchOptions,
  });
  return handleResponse(response);
}