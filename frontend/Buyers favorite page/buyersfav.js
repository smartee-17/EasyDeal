// app.js
const empty = document.querySelector("#empty-state");
const grid = document.querySelector("#favorites-grid");
const count = document.querySelector("#item-count");

let favoritesData = [];

async function fetchFavorites() {
  try {
    const response = await fetch("buyersfav.json");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    favoritesData = await response.json();

    updateUI();
  } catch (error) {
    console.error("Failed to fetch favorites data:", error);
  }
}
function updateUI() {
  if (favoritesData.length === 0) {
    count.textContent = `0 saved items`;
    empty.classList.remove("hidden");
    grid.classList.add("hidden");
  } else if (favoritesData.length >= 1) {
    count.textContent = `${favoritesData.length} saved items`;

    empty.classList.add("hidden");
    grid.classList.remove("hidden");
    renderFavorites();
  }
}
function renderFavorites() {
  grid.innerHTML = "";

  favoritesData.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <div class="image-container">
        <img src="${product.image}" alt="${product.title}">
        ${!product.inStock ? '<span class="badge-out">Out of Stock</span>' : ""}
        <button class="btn-remove" data-id="${product.id}">✕</button>
      </div>
      <div class="card-info">
        <span class="category">${product.category}</span>
        <h3 class="product-title">${product.title}</h3>
        <div class="price-container">
          <span class="price">$${product.price}</span>
         
        </div>
      </div>
      ${product.inStock ? '<button class="btn-cart">View Product</button>' : '<button class="btn-disabled" disabled>Unavailable</button>'}
    `;

    grid.appendChild(card);
  });
}
grid.addEventListener("click", (event) => {
  const removeBtn = event.target.closest(".btn-remove");

  if (removeBtn) {
    const productId = parseInt(removeBtn.dataset.id);

    handleRemoveItem(productId);
  }
});

function handleRemoveItem(productId) {
  favoritesData = favoritesData.filter((product) => product.id !== productId);

  updateUI();
}

document.addEventListener("DOMContentLoaded", fetchFavorites);
