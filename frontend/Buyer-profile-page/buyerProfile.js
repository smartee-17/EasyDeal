const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userPhone = document.getElementById("userPhone");
const userCity = document.getElementById("userCity");
const userJoined = document.getElementById("userJoined");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const removePhotoBtn = document.getElementById("removePhotoBtn");
const avatarInput = document.getElementById("avatarInput");
const cartCount = document.getElementById("cartCount");
const favCount = document.getElementById("favCount");

const tabButtons = document.querySelectorAll(".profile-tabs__btn");
const cartPanel = document.getElementById("cartPanel");
const favoritesPanel = document.getElementById("favoritesPanel");

const cartList = document.getElementById("cartList");
const summaryItems = document.getElementById("summaryItems");
const summaryTotal = document.getElementById("summaryTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const favGrid = document.getElementById("favGrid");

const editBtn = document.getElementById("editProfileBtn");
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const cancelEdit = document.getElementById("cancelEdit");
const logoutBtn = document.getElementById("logoutBtn");

const STORE_PHONE = "2510000000";
const USE_DEMO_DATA = true;

let allProductsData = [];
let cart = [];
let favorites = [];

let user = {
  name: "Nathan Example",
  email: "nathan@example.com",
  phone: "+251 900 000 000",
  city: "Addis Ababa",
  joined: "November 2026",
};

async function fetchData() {
  try {
    let res = await fetch("https://easydeal.onrender.com/api/products");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    let result = await res.json();
    allProductsData = result.data;

    if (USE_DEMO_DATA && cart.length === 0 && favorites.length === 0) {
      cart = allProductsData.slice(0, 2).map((p) => ({ id: p._id, qty: 1 }));
      favorites = allProductsData.slice(2, 6).map((p) => p._id);
    }

    renderCart();
    renderFavorites();
  } catch (error) {
    console.error("Fetch failed:", error);
    cartList.innerHTML = "<p class='empty-note'>Error loading your cart.</p>";
    favGrid.innerHTML = "<p class='empty-note'>Error loading favorites.</p>";
  }
}

function renderUser() {
  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user.avatar) {
    userAvatar.innerHTML = `<img class="user-card__avatar-img" src="${user.avatar}" alt="Profile picture" />`;
  } else {
    userAvatar.textContent = initials || "?";
  }
  removePhotoBtn.classList.toggle("hidden", !user.avatar);
  userName.textContent = user.name;
  userEmail.textContent = user.email;
  userPhone.textContent = user.phone || "No phone added";
  userCity.textContent = user.city || "No city added";
  userJoined.textContent = `Member since ${user.joined}`;
}

function getPrice(product) {
  return Number(String(product.price).replace(/[^\d.]/g, "")) || 0;
}

function renderCart() {
  const cartItems = cart
    .map((item) => ({
      product: allProductsData.find((p) => p._id === item.id),
      qty: item.qty,
    }))
    .filter((item) => item.product);

  let totalItems = 0;
  let totalPrice = 0;

  if (cartItems.length === 0) {
    cartList.innerHTML = "<p class='empty-note'>Your cart is empty.</p>";
  } else {
    cartList.innerHTML = cartItems
      .map(({ product, qty }) => {
        totalItems += qty;
        totalPrice += getPrice(product) * qty;

        return `
        <li class="cart-item" data-id="${product._id}">
          <img class="cart-item__img" src="${product.images[0]?.url || "Assets/placeholder.png"}" alt="${product.images[0]?.alt?.standard || "Product Image"}" />
          <div class="cart-item__details">
            <h3 class="cart-item__title">${product.title}</h3>
            <p class="cart-item__price">${product.price}</p>
            <div class="cart-item__qty">
              <button data-action="minus">-</button>
              <span>${qty}</span>
              <button data-action="plus">+</button>
            </div>
          </div>
          <button class="cart-item__remove" data-action="remove">Remove</button>
        </li>`;
      })
      .join("");
  }

  summaryItems.textContent = totalItems;
  summaryTotal.textContent = totalPrice.toLocaleString();
  cartCount.textContent = totalItems;
  checkoutBtn.disabled = cartItems.length === 0;
}

function renderFavorites() {
  const favProducts = favorites
    .map((id) => allProductsData.find((p) => p._id === id))
    .filter(Boolean);

  favCount.textContent = favProducts.length;

  if (favProducts.length === 0) {
    favGrid.innerHTML = "<p class='empty-note'>No favorites yet.</p>";
    return;
  }

  favGrid.innerHTML = favProducts
    .map(
      (product) => `
      <div class="fav-card" data-id="${product._id}">
        <div class="fav-card__img-wrap">
          <img class="fav-card__img" src="${product.images[0]?.url || "Assets/placeholder.png"}" alt="${product.images[0]?.alt?.standard || "Product Image"}" />
          <img class="fav-card__heart" src="Assets/icons/heart-filled-icon.svg" data-action="unfavorite" alt="Remove from favorites" />
        </div>
        <div class="fav-card__body">
          <div class="fav-card__top">
            <h3 class="fav-card__title">${product.title}</h3>
            <p class="fav-card__price">${product.price}</p>
          </div>
          <button class="fav-card__btn" data-action="add-to-cart">Add to cart</button>
        </div>
      </div>`,
    )
    .join("");
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const isCart = btn.dataset.tab === "cart";
    cartPanel.classList.toggle("hidden", !isCart);
    favoritesPanel.classList.toggle("hidden", isCart);
  });
});

cartList.addEventListener("click", (event) => {
  const clickedBtn = event.target.closest("button[data-action]");
  if (!clickedBtn) return;

  const id = clickedBtn.closest(".cart-item").dataset.id;
  const item = cart.find((i) => i.id === id);
  const action = clickedBtn.dataset.action;

  if (action === "plus") item.qty++;
  if (action === "minus") item.qty = Math.max(1, item.qty - 1);
  if (action === "remove") cart = cart.filter((i) => i.id !== id);

  renderCart();
});

favGrid.addEventListener("click", (event) => {
  const clicked = event.target.closest("[data-action]");
  if (!clicked) return;

  const id = clicked.closest(".fav-card").dataset.id;
  const action = clicked.dataset.action;

  if (action === "unfavorite") {
    favorites = favorites.filter((favId) => favId !== id);
  }

  if (action === "add-to-cart") {
    const existing = cart.find((i) => i.id === id);
    if (existing) existing.qty++;
    else cart.push({ id, qty: 1 });
    clicked.textContent = "Added!";
    setTimeout(() => (clicked.textContent = "Add to cart"), 1000);
  }

  renderCart();
  if (action === "unfavorite") renderFavorites();
});

checkoutBtn.addEventListener("click", () => {
  const lines = cart
    .map((item) => {
      const product = allProductsData.find((p) => p._id === item.id);
      return product
        ? `- ${product.title} x${item.qty} (${product.price})`
        : "";
    })
    .filter(Boolean)
    .join("\n");

  const message = `Hello, I would like to order:\n${lines}\nTotal: ${summaryTotal.textContent}`;
  window.open(
    `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(message)}`,
    "_blank",
  );
});

editBtn.addEventListener("click", () => {
  editForm.name.value = user.name;
  editForm.email.value = user.email;
  editForm.phone.value = user.phone;
  editForm.city.value = user.city;
  editModal.showModal();
});

cancelEdit.addEventListener("click", () => editModal.close());

editForm.addEventListener("submit", () => {
  user = {
    ...user,
    name: editForm.name.value.trim(),
    email: editForm.email.value.trim(),
    phone: editForm.phone.value.trim(),
    city: editForm.city.value.trim(),
  };
  renderUser();
});

function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        canvas
          .getContext("2d")
          .drawImage(
            img,
            (img.width - side) / 2,
            (img.height - side) / 2,
            side,
            side,
            0,
            0,
            size,
            size,
          );
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

changePhotoBtn.addEventListener("click", () => avatarInput.click());
userAvatar.addEventListener("click", () => avatarInput.click());

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    return;
  }

  try {
    user.avatar = await resizeImage(file);
    renderUser();
  } catch (error) {
    console.error("Photo failed:", error);
    alert("Could not load that image.");
  }

  avatarInput.value = "";
});

removePhotoBtn.addEventListener("click", () => {
  delete user.avatar;
  renderUser();
});

logoutBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

renderUser();
fetchData();
