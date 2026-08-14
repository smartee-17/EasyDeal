const productsContainer = document.querySelectorAll(".products");
const categoriesContainer = document.querySelector(".categories-list");
const categoriesScrollContainer = document.querySelector(".categories-scroll");
const leftArrow = document.getElementById("slideLeftBtn");
const rightArrow = document.getElementById("slideRightBtn");

let allProductsData = [];
let allCategoriesData = [];

async function fetchData() {
  try {
    let res = await fetch("https://easydeal.onrender.com/api/products");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    let result = await res.json();
    allProductsData = result.data;
    console.log(result);
    console.log("Sample product from API:", allProductsData[0]);

    await renderCategories();

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

async function renderCategories() {
  if (!categoriesContainer) return;

  try {
    const response = await fetch(
      "https://easydeal.onrender.com/api/categories",
    );
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const { data } = await response.json();
    console.log("Categories API response:", data);

    const categoryLabels = data
      .map((item) => item.label || item.name || item)
      .filter(Boolean);

    const categories = ["All Products", ...new Set(categoryLabels)];
    allCategoriesData = categories;

    categoriesContainer.innerHTML = categories
      .map(
        (cat) => `
        <li class="category-bar__item">
          <button class="category-bar__item-btn ${cat === "All Products" ? "active" : ""}">
            ${cat}
          </button>
        </li>`,
      )
      .join("");

    categoriesContainer.addEventListener("click", (e) => {
      const clickedBtn = e.target.closest(".category-bar__item-btn");
      if (!clickedBtn) return;

      categoriesContainer
        .querySelectorAll(".category-bar__item-btn")
        .forEach((btn) => btn.classList.remove("active"));

      clickedBtn.classList.add("active");

      const selectedCategory = clickedBtn.textContent.trim();

      renderProducts(selectedCategory);
    });
  } catch (error) {
    console.error("Failed to render categories:", error);
  }
}

function renderProducts(categoryFilter) {
  if (productsContainer.length === 0) return;

  productsContainer.forEach((pro) => (pro.innerHTML = ""));

  const filtered =
    categoryFilter === "All Products"
      ? allProductsData
      : allProductsData.filter((p) => {
          const prodCategory = (
            p.label ||
            p.category?.label ||
            p.category?.name ||
            p.category ||
            ""
          )
            .toString()
            .trim()
            .toLowerCase();
          const targetCategory = categoryFilter.toString().trim().toLowerCase();

          return prodCategory === targetCategory;
        });

  const displayLimitData = filtered.slice(0, 4);

  displayLimitData.forEach((product) => {
    productsContainer.forEach((pro) => {
      pro.innerHTML += `
        <div class="product-card" id="${product._id}">
          <div class="product-card-img__container">
            <img class="product-card__image" src="${product.images[0]?.url || "Assets/placeholder.png"}" alt="${product.images[0]?.alt?.standard || "Product Image"}" />
            <img class="product-card_greentick" src="Assets/icons/correct-success-icon.svg" alt="Verified" />
            <img class="product-card_heart" src="Assets/icons/heart-icon.svg" data-liked="false" alt="Favorite" />
          </div>
          <div class="card-info">
            <div class="pt">
              <h3 class="product-card__title">${product.title}</h3>
              <p class="product-card__price">${product.price}</p>
            </div>
            <p class="product-card_description">${product.description}</p>
            <button class="product-card__button">
              <img src="Assets/icons/whatsapp-icon.svg" class="icon" alt="WhatsApp" />
              WhatsApp
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
      const heartImg = event.target.closest(".product-card_heart");
      if (!heartImg) return;

      const isLiked = heartImg.getAttribute("data-liked") === "true";

      if (isLiked) {
        heartImg.src = "Assets/icons/heart-icon.svg";
        heartImg.setAttribute("data-liked", "false");
      } else {
        heartImg.src = "Assets/icons/heart-filled-icon.svg";
        heartImg.setAttribute("data-liked", "true");
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
