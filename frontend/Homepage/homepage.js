const productsContainer = document.querySelector(".products");
const categoriesContainer = document.querySelector(".category-bar__list");

let allProductsData = [];

async function fetchData() {
  try {
    let res = await fetch("products.json");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    let result = await res.json();
    allProductsData = result.data;

    renderCategories(allProductsData);
    renderProducts("All Products");
  } catch (error) {
    console.error("Fetch failed:", error);
    productsContainer.innerHTML = "<p>Error loading products.</p>";
  }
}

function renderCategories(data) {
  let categories = [
    "All Products",
    ...new Set(data.map((item) => item.category)),
  ];

  categoriesContainer.innerHTML = categories
    .map(
      (cat) =>
        `<li class="category-bar__item "><button class="category-bar__item-btn ${cat === "All Products" ? "active" : ""}">${cat}</button></li>`,
    )
    .join("");

  document.querySelectorAll(".category-bar__item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".category-bar__item-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      renderProducts(e.target.textContent);
    });
  });
}

function renderProducts(categoryFilter) {
  productsContainer.innerHTML = "";

  const filtered =
    categoryFilter === "All Products"
      ? allProductsData
      : allProductsData.filter((p) => p.category === categoryFilter);

  filtered.forEach((product) => {
    productsContainer.innerHTML += `
      <div class="product-card" id="${product._id}">
        <img class="product-card__image" src="${product.images[0]}" alt="${product.altText}" />
        <h3 class="product-card__title">${product.title}</h3>
        <p class="product-card__price">${product.price}</p>
        <button class="product-card__button">Add to Cart</button>
      </div>
    `;
  });
}

fetchData();
