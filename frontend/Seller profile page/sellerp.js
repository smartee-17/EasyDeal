const productsContainer = document.querySelectorAll(".products");
const categoriesContainer = document.getElementById("seller-categories");
const searchInput = document.getElementById("seller-search");

let allProductsData = [];
let sellerProductsData = [];

const targetSellerId = new URLSearchParams(window.location.search).get("id");

async function fetchData() {
  try {
    let res = await fetch("https://easydeal.onrender.com/api/products");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    let result = await res.json();
    allProductsData = result.data;

    sellerProductsData = targetSellerId
      ? allProductsData.filter(
          (p) =>
            p.seller?._id === targetSellerId || p.seller === targetSellerId,
        )
      : allProductsData;

    updateSellerProfileHeader(sellerProductsData[0]?.seller);
    renderCategories();
    renderProducts("All Products");
  } catch (error) {
    if (productsContainer.length > 0) {
      productsContainer.forEach((container) => {
        container.innerHTML = "<p>Error loading seller items.</p>";
      });
    }
  }
}

function updateSellerProfileHeader(sellerInfo) {
  if (!sellerInfo) return;

  const sellerNameEl = document.getElementById("seller-name");
  const sellerAvatarEl = document.getElementById("seller-avatar");
  const statCountEl = document.getElementById("stat-count");
  const countBadgeEl = document.getElementById("product-count-badge");

  if (sellerNameEl && sellerInfo.name) {
    sellerNameEl.childNodes[0].textContent = `${sellerInfo.name} `;
  }
  if (sellerAvatarEl && sellerInfo.avatar) {
    sellerAvatarEl.src = sellerInfo.avatar;
  }
  if (statCountEl) statCountEl.textContent = sellerProductsData.length;
  if (countBadgeEl) countBadgeEl.textContent = sellerProductsData.length;
}

function renderCategories() {
  if (!categoriesContainer) return;

  const categoryLabels = sellerProductsData
    .map(
      (item) =>
        item.label ||
        item.category?.label ||
        item.category?.name ||
        item.category,
    )
    .filter(Boolean);

  const categories = ["All Products", ...new Set(categoryLabels)];

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
    renderProducts(clickedBtn.textContent.trim());
  });
}

function renderProducts(categoryFilter, searchTerm = "") {
  if (productsContainer.length === 0) return;

  productsContainer.forEach((pro) => (pro.innerHTML = ""));

  let filtered =
    categoryFilter === "All Products"
      ? sellerProductsData
      : sellerProductsData.filter((p) => {
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
          return (
            prodCategory === categoryFilter.toString().trim().toLowerCase()
          );
        });

  if (searchTerm) {
    filtered = filtered.filter((p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  if (filtered.length === 0) {
    productsContainer.forEach((pro) => {
      pro.innerHTML = "<p>No products found for this seller.</p>";
    });
    return;
  }

  filtered.forEach((product) => {
    productsContainer.forEach((pro) => {
      pro.innerHTML += `
        <div class="product-card" id="${product._id}">
          <div class="product-card-img__container">
            <img class="product-card__image" src="${product.images[0]?.url || "Assets/placeholder.png"}" alt="${product.images[0]?.alt?.standard || product.title || "Product Image"}" />
            <img class="product-card_greentick" src="Assets/icons/correct-success-icon.svg" alt="Verified" />
            <img class="product-card_heart" src="Assets/icons/heart-icon.svg" data-liked="false" alt="Favorite" />
          </div>
          <div class="card-info">
            <div class="pt">
              <h3 class="product-card__title">${product.title}</h3>
              <p class="product-card__price">${product.price}</p>
            </div>
            <p class="product-card_description">${product.description || ""}</p>
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

searchInput?.addEventListener("input", (e) => {
  const activeCategoryBtn = categoriesContainer?.querySelector(
    ".category-bar__item-btn.active",
  );
  const activeCategory = activeCategoryBtn
    ? activeCategoryBtn.textContent.trim()
    : "All Products";
  renderProducts(activeCategory, e.target.value.trim());
});

fetchData();
bindHeartEvents();
