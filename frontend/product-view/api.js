const BASE_URL = "https://easydeal.onrender.com/api/products";

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
  const response = await fetch(`${BASE_URL}/${id}`);
  return handleResponse(response);
}

export async function fetchRelatedProducts() {
  const response = await fetch(BASE_URL);
  return handleResponse(response);
}
