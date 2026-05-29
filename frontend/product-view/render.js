import { openWA } from "../shared/utils.js";

export function renderProductInfo(product, elements) {
  const { titleEl, priceEl, descEl } = elements;
  if (titleEl) titleEl.textContent = product.title;
  if (priceEl) priceEl.textContent = `$${Number(product.price).toLocaleString()}`;
  if (descEl) descEl.textContent = product.description || "";
}

export function renderGallery(product, elements) {
  const { track, dotsContainer, thumbsContainer } = elements;
  let images = product.images || [];
  
  if (images.length === 1) {
    images = [images[0], images[0], images[0]];
  }
  if (!images.length) return;

  let index = 0;
  let dots = [];

  track.innerHTML = images.map(img => `
    <div class="gallery__slide" style="min-width: 100%; flex: 0 0 100%; box-sizing: border-box;">
      <img src="${img.url || ""}" alt="${product.title}" style="width: 100%; display: block; object-fit: cover;">
    </div>
  `).join("");

  thumbsContainer.innerHTML = images.map((img, i) => `
    <img src="${img.url || ""}" class="gallery__thumb ${i === 0 ? "is-active" : ""}" data-index="${i}">
  `).join("");

  const thumbs = document.querySelectorAll(".gallery__thumb");
  dotsContainer.innerHTML = "";

  images.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "gallery__dot";
    if (i === 0) dot.classList.add("is-active");
    dot.onclick = () => { index = i; update(); };
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  function update() {
    if (track) track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(d => d.classList.remove("is-active"));
    dots[index]?.classList.add("is-active");
    thumbs.forEach(t => t.classList.remove("is-active"));
    thumbs[index]?.classList.add("is-active");
  }

  const nextBtn = document.getElementById("next");
  if (nextBtn) {
    nextBtn.onclick = () => {
      index = (index + 1) % images.length;
      update();
    };
  }

  const prevBtn = document.getElementById("prev");
  if (prevBtn) {
    prevBtn.onclick = () => {
      index = (index - 1 + images.length) % images.length;
      update();
    };
  }

  thumbs.forEach((t, i) => {
    t.onclick = () => {
      index = i;
      update();
    };
  });
}

export function renderSimilarProducts(products) {
  const grid = document.querySelector(".similar-products__grid");
  if (!grid) return;

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-card__image">
        <img src="${p.images?.[0]?.url || ""}" alt="${p.title}" />
      </div>
      <div class="product-card__body">
        <h4 class="product-card__name">${p.title}</h4>
        <p class="product-card__price">$${Number(p.price).toLocaleString()}</p>
        <button class="product-card__chat-btn"
          data-phone="${p.seller?.whatsapp || ""}"
          data-title="${p.title}">
          <i class="fa-brands fa-whatsapp"></i> Chat Seller
        </button>
      </div>
    </div>
  `).join("");
}

export function setupInteractions(currentProduct) {
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
    const text = `Hello, I'm interested in: ${currentProduct?.title}`;
    openWA(currentProduct?.seller?.whatsapp || currentProduct?.seller, text);
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-card__chat-btn");
    if (!btn) return;
    const text = `Hello, I'm interested in: ${btn.dataset.title}`;
    openWA(btn.dataset.phone, text);
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
  const sun = themeToggle?.querySelector(".sun");
  const moon = themeToggle?.querySelector(".moon");
  const savedTheme = localStorage.getItem("theme");

  function applyTheme(isDark) {
    if (isDark) {
      document.body.setAttribute("data-theme", "dark");
      if (sun) sun.style.display = "none";
      if (moon) moon.style.display = "block";
    } else {
      document.body.removeAttribute("data-theme");
      if (sun) sun.style.display = "block";
      if (moon) moon.style.display = "none";
    }
  }

  applyTheme(savedTheme === "dark");

  themeToggle?.addEventListener("click", () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    applyTheme(!isDark);
    localStorage.setItem("theme", !isDark ? "dark" : "light");
  });
}

export function renderInvalidLink() {
  document.body.innerHTML = `
    <div style="padding:40px;text-align:center;font-family:sans-serif">
      <h2> Invalid product link</h2>
      <p>Please go back to the home page and select a product.</p>
    </div>
  `;
}

export function renderServerWakeup() {
  document.body.innerHTML = `
    <div style="padding:40px;text-align:center;font-family:sans-serif">
      <p> <strong>Waking up the server...</strong></p>
      <p>This usually takes 2-3 minutes on the first load. Stay on this page!</p>
      <div class="page-loader__spinner" style="margin: 20px auto;"></div>
    </div>
  `;
}
