let products = [];
let currentProduct = null;

const API_URL = "http://localhost:3000/api/products";

document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API not responding");

    const response = await res.json();

    products = response.data || [];
    currentProduct = products[0];

    if (!currentProduct) throw new Error("No product in API");

    document.getElementById("loader")?.classList.add("is-hidden");

    initProductPage();

  } catch (err) {
    console.error("API failed:", err);

    document.body.innerHTML = `
      <div style="padding:20px;text-align:center;font-family:sans-serif">
        ⚠️ Failed to load products. Please check backend or refresh page.
      </div>
    `;
  }
}

function initProductPage() {
  const titleEl = document.querySelector(".product-info__title");
  const priceEl = document.querySelector(".price__current");
  const descEl = document.getElementById("productDescription");

  const track = document.getElementById("galleryTrack");
  const dotsContainer = document.getElementById("dots");
  const thumbsContainer = document.querySelector(".gallery__thumbs");

  if (!track || !dotsContainer || !thumbsContainer) return;

  renderProductInfo(titleEl, priceEl, descEl);
  renderGallery(track, dotsContainer, thumbsContainer);
  renderSimilarProducts();
  setupInteractions();
}

/* ---------------- PRODUCT INFO ---------------- */
function renderProductInfo(titleEl, priceEl, descEl) {
  if (titleEl) titleEl.textContent = currentProduct.title;
  if (priceEl) priceEl.textContent = `$${Number(currentProduct.price).toLocaleString()}`;
  if (descEl) descEl.textContent = currentProduct.description || "";
}

/* ---------------- GALLERY ---------------- */
function renderGallery(track, dotsContainer, thumbsContainer) {
  const images = currentProduct.images || [];
  if (!images.length) return;

  let index = 0;
  let dots = [];

  track.innerHTML = images.map(img => `
    <div class="gallery__slide">
      <img src="${img}" alt="${currentProduct.title}">
    </div>
  `).join("");

  thumbsContainer.innerHTML = images.map((img, i) => `
    <img src="${img}" class="gallery__thumb ${i === 0 ? "is-active" : ""}" data-index="${i}">
  `).join("");

  const thumbs = document.querySelectorAll(".gallery__thumb");

  dotsContainer.innerHTML = "";

  images.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "gallery__dot";
    if (i === 0) dot.classList.add("is-active");

    dot.onclick = () => {
      index = i;
      update();
    };

    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach(d => d.classList.remove("is-active"));
    dots[index]?.classList.add("is-active");

    thumbs.forEach(t => t.classList.remove("is-active"));
    thumbs[index]?.classList.add("is-active");
  }

  document.getElementById("next")?.addEventListener("click", () => {
    index = (index + 1) % images.length;
    update();
  });

  document.getElementById("prev")?.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    update();
  });

  thumbs.forEach((t, i) => {
    t.addEventListener("click", () => {
      index = i;
      update();
    });
  });
}

/* ---------------- SIMILAR PRODUCTS ---------------- */
function renderSimilarProducts() {
  const grid = document.querySelector(".similar-products__grid");
  if (!grid) return;

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.images?.[0] || ""}" />
      <div>
        <h4>${p.title}</h4>
        <p>$${Number(p.price).toLocaleString()}</p>

        <button class="product-card__chat-btn"
          data-phone="${p.seller?.whatsapp || ""}"
          data-title="${p.title}">
          Chat Seller
        </button>
      </div>
    </div>
  `).join("");
}

/* ---------------- INTERACTIONS ---------------- */
function setupInteractions() {
  let qty = 1;
  const qtyEl = document.getElementById("qty");

  document.getElementById("plus")?.addEventListener("click", () => {
    qty++;
    if (qtyEl) qtyEl.textContent = qty;
  });

  document.getElementById("minus")?.addEventListener("click", () => {
    if (qty > 1) qty--;
    if (qtyEl) qtyEl.textContent = qty;
  });

  document.getElementById("chatSellerBtn")?.addEventListener("click", () => {
    openWA(currentProduct?.seller?.whatsapp, currentProduct?.title);
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-card__chat-btn");
    if (!btn) return;

    openWA(btn.dataset.phone, btn.dataset.title);
  });

  /* ---------------- WISHLIST ---------------- */
  const wishlist = document.getElementById("wishlist");

  wishlist?.addEventListener("click", () => {
    const saved = wishlist.classList.toggle("is-saved");

    wishlist.innerHTML = saved
      ? `<i class="fa-solid fa-heart"></i> Saved`
      : `<i class="fa-regular fa-heart"></i> Save`;
  });

  /* ---------------- TABS ---------------- */
  document.querySelectorAll(".tabs__btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs__btn").forEach(b => b.classList.remove("is-active"));
      document.querySelectorAll(".tabs__panel").forEach(p => p.classList.remove("is-active"));

      btn.classList.add("is-active");
      document.getElementById(btn.dataset.tab)?.classList.add("is-active");
    });
  });

  /* ---------------- THEME TOGGLE (SUN / MOON FIXED) ---------------- */
  const themeToggle = document.getElementById("themeToggle");
  const sun = themeToggle?.querySelector(".sun");
  const moon = themeToggle?.querySelector(".moon");

  const savedTheme = localStorage.getItem("theme");

  function applyTheme(isDark) {
    if (isDark) {
      document.body.setAttribute("data-theme", "dark");
      sun && (sun.style.display = "none");
      moon && (moon.style.display = "block");
    } else {
      document.body.removeAttribute("data-theme");
      sun && (sun.style.display = "block");
      moon && (moon.style.display = "none");
    }
  }

  applyTheme(savedTheme === "dark");

  themeToggle?.addEventListener("click", () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";

    applyTheme(!isDark);
    localStorage.setItem("theme", !isDark ? "dark" : "light");
  });
}

/* ---------------- WHATSAPP (FIXED) ---------------- */
function openWA(phone, title) {
  if (!phone) {
    console.warn("No WhatsApp number found for this seller");
    return;
  }

  const msg = encodeURIComponent(`Hello, I'm interested in: ${title}`);
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
}