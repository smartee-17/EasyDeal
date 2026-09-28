const BASE_URL = "https://easydeal.onrender.com/api/products";

async function handleResponse(response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.message || `Server error: ${response.status}`
    );
  }

  return result.data;
}

export async function createProduct(product, imageFiles = []) {
  if (imageFiles.length > 5) {
    throw new Error("Maximum of 5 images allowed");
  }

  if ((product.tags || []).length > 5) {
    throw new Error("Maximum of 5 tags allowed");
  }

  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("You must be logged in to publish a product.");
  }

  const formData = new FormData();

  formData.append("title", product.title);
  formData.append("description", product.description);
  formData.append("category", product.category);
  formData.append("price", product.price);
  formData.append("location", product.location);

  formData.append(
    "tags",
    JSON.stringify(product.tags || [])
  );

  formData.append(
    "specifications",
    JSON.stringify(product.specifications || [])
  );

  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  return handleResponse(response);
}