let products = [];
let currentProduct = null;

async function loadProducts() {
  try {
    const res = await fetch("http://localhost:5000/api/products");

    if (!res.ok) throw new Error("API not responding");

    const data = await res.json();

    products = data;
    currentProduct = products?.[0];

    if (!currentProduct) throw new Error("No product in API");

    initProductPage();

  } catch (err) {
    console.warn("⚠️ API failed, using mock data:", err);

    const module = await import("./mockData.js");

    products = module.products;
    currentProduct = products?.[0];

    if (!currentProduct) {
      console.error("❌ No product found in mock data");
      return;
    }

    initProductPage();
  }
}

loadProducts();

function initProductPage() {

  const titleEl = document.querySelector(".product-info__title");
  const priceEl = document.querySelector(".price__current");
  const descEl = document.getElementById("productDescription");

  if (titleEl) titleEl.textContent = currentProduct.title;
  if (priceEl) priceEl.textContent = `$${Number(currentProduct.price).toLocaleString()}`;
  if (descEl) descEl.textContent = currentProduct.description || "";

  const track = document.getElementById("galleryTrack");
  const dotsContainer = document.getElementById("dots");
  const thumbsContainer = document.querySelector(".gallery__thumbs");

  const images = currentProduct.images || [];
  let index = 0;
  let dots = [];

  if (!images.length) return;

  track.innerHTML = images.map(img => `
    <div class="gallery__slide">
      <img src="${img}" alt="${currentProduct.title}">
    </div>
  `).join("");

  thumbsContainer.innerHTML = images.map((img, i) => `
    <img src="${img}" class="gallery__thumb ${i === 0 ? "is-active" : ""}" data-index="${i}">
  `).join("");

  const thumbs = document.querySelectorAll(".gallery__thumb");

  // dots
  dotsContainer.innerHTML = "";

  images.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "gallery__dot";
    if (i === 0) dot.classList.add("is-active");

    dot.onclick = () => {
      index = i;
      updateGallery();
    };

    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  function updateGallery() {
    track.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach(d => d.classList.remove("is-active"));
    dots[index]?.classList.add("is-active");

    thumbs.forEach(t => t.classList.remove("is-active"));
    thumbs[index]?.classList.add("is-active");
  }

  document.getElementById("next")?.addEventListener("click", () => {
    index = (index + 1) % images.length;
    updateGallery();
  });

  document.getElementById("prev")?.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    updateGallery();
  });

  // thumb click
  thumbs.forEach((t, i) => {
    t.addEventListener("click", () => {
      index = i;
      updateGallery();
    });
  });

  const similarGrid = document.querySelector(".similar-products__grid");

  if (similarGrid) {
    similarGrid.innerHTML = products.map(p => `
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

  function openWA(phone, title) {
    const msg = encodeURIComponent(`Hello, I'm interested in: ${title}`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }

  document.getElementById("chatSellerBtn")?.addEventListener("click", () => {
    openWA(currentProduct.seller?.whatsapp, currentProduct.title);
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-card__chat-btn");
    if (!btn) return;

    openWA(btn.dataset.phone, btn.dataset.title);
  });

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

  const wishlist = document.getElementById("wishlist");

  wishlist?.addEventListener("click", () => {
    const saved = wishlist.classList.toggle("is-saved");

    wishlist.innerHTML = saved
      ? `<i class="fa-solid fa-heart"></i> Saved`
      : `<i class="fa-regular fa-heart"></i> Save`;
  });

  document.querySelectorAll(".tabs__btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs__btn").forEach(b => b.classList.remove("is-active"));
      document.querySelectorAll(".tabs__panel").forEach(p => p.classList.remove("is-active"));

      btn.classList.add("is-active");
      document.getElementById(btn.dataset.tab)?.classList.add("is-active");
    });
  });


  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
  }

  themeToggle?.addEventListener("click", () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";

    if (isDark) {
      document.body.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.body.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  });


  window.addEventListener("load", () => {
    document.getElementById("loader")?.classList.add("is-hidden");
  });
}