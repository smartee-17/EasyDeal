const productsContainer = document.querySelectorAll(".products");
const categoriesContainer = document.querySelector(".categories-list");
const categoriesScrollContainer = document.querySelector(".categories-scroll");
const leftArrow = document.getElementById("slideLeftBtn");
const rightArrow = document.getElementById("slideRightBtn");

let allProductsData = [];

async function fetchData() {
  try {
    let res = await fetch("https://easydeal.onrender.com/api/products");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    let result = await res.json();

    allProductsData = result.data;

    renderCategories(allProductsData);

    if (productsContainer.length > 0) {
      renderProducts("All Products");
    }
  } catch (error) {
    console.error("Fetch failed:", error);
    if (productsContainer.length > 0) {
      productsContainer.forEach((container) => {
        container.innerHTML = "<p>Error loading products.</p>";
      });
    }
  }
}

function renderCategories(data) {
  if (!categoriesContainer) return;

  let categories = [
    "All Products",
    ...new Set(data.map((item) => item.category)),
  ];

  categoriesContainer.innerHTML = categories
    .map(
      (cat) =>
        `<li class="category-bar__item"><button class="category-bar__item-btn ${cat === "All Products" ? "active" : ""}">${cat}</button></li>`,
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
  if (productsContainer.length === 0) return;

  productsContainer.forEach((pro) => (pro.innerHTML = ""));

  const filtered =
    categoryFilter === "All Products"
      ? allProductsData
      : allProductsData.filter((p) => p.category === categoryFilter);

  const displayLimitData = filtered.slice(0, 4);

  displayLimitData.forEach((product) => {
    productsContainer.forEach((pro) => {
      pro.innerHTML += `
        <div class="product-card" id="${product._id}">
        <div class="product-card-img__container">
          <img class="product-card__image" src="${product.images[0]?.url || "Assets/placeholder.png"}" alt="${product.images[0]?.alt?.standard || "Product Image"}" />
          <img class="product-card_greentick" src="Assets/icons/image 4.png" alt="green-tick-icon">
          <img class="product-card_heart" src="Assets/icons/image 77.png" alt="heart-icon-outline">
          <img class="product-card_heart-red hidden" src="Assets/heart.png" alt="heart-icon-outline">
          </div>
          <div class="card-info">
            <div class="pt">
              <h3 class="product-card__title">${product.title}</h3>
              <p class="product-card__price">${product.price}</p>
            </div>
            <p class="product-card_description">${product.description}</p>
            <button class="product-card__button">
              <img src="Assets/icons/image 101.png" alt="WhatsApp logo"> WhatsApp
            </button>
          </div>
        </div>
      `;
    });
  });
}

function bindHeartEvents() {
  productsContainer.forEach((container) => {
    container.addEventListener("click", (event) => {
      const clickedHeart = event.target.closest(
        ".product-card_heart, .product-card_heart-red",
      );
      if (!clickedHeart) return;

      const card = clickedHeart.closest(".product-card");
      if (!card) return;

      const outlineHeart = card.querySelector(".product-card_heart");
      const filledHeart = card.querySelector(".product-card_heart-red");

      if (!outlineHeart || !filledHeart) return;

      if (filledHeart.classList.contains("hidden")) {
        outlineHeart.classList.add("hidden");
        filledHeart.classList.remove("hidden");
      } else {
        outlineHeart.classList.remove("hidden");
        filledHeart.classList.add("hidden");
      }
    });
  });
}

fetchData();
bindHeartEvents();
leftArrow?.addEventListener("click", () => {
  if (categoriesScrollContainer) {
    categoriesScrollContainer.scrollBy({ left: -220, behavior: "smooth" });
  } else if (categoriesContainer) {
    categoriesContainer.scrollBy({ left: -220, behavior: "smooth" });
  }
});

rightArrow?.addEventListener("click", () => {
  if (categoriesScrollContainer) {
    categoriesScrollContainer.scrollBy({ left: 220, behavior: "smooth" });
  } else if (categoriesContainer) {
    categoriesContainer.scrollBy({ left: 220, behavior: "smooth" });
  }
});
