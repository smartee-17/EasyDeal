import { openWA } from "../shared/utils.js";

export function renderProductInfo(product, elements) {
  const { titleEl, priceEl, descEl } = elements;
  if (titleEl) titleEl.textContent = product.title;
  if (priceEl) priceEl.textContent = `$${Number(product.price).toLocaleString()}`;
  if (descEl) descEl.textContent = product.description || "";

  // Price banner
  const priceBanner = document.querySelector(".price-banner .price__current");
  if (priceBanner) priceBanner.textContent = `$${Number(product.price).toLocaleString()}`;

  // Price comparison box
  const marketEl = document.querySelector(".price__original");
  const listedEl = document.querySelector(".price__current-dup");
  const savingsEl = document.querySelector(".price__savings");
  if (marketEl) marketEl.textContent = product.marketPrice ? `$${Number(product.marketPrice).toLocaleString()}` : "";
  if (listedEl) listedEl.textContent = `$${Number(product.price).toLocaleString()}`;
  if (savingsEl) savingsEl.textContent = product.savings ? `$${Number(product.savings).toLocaleString()} (12%)` : "";

  // Seller info
  const sellerNameEl = document.querySelector(".seller-name");
  if (sellerNameEl) sellerNameEl.textContent = product.seller?.name || "";

  // Meta fields
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };
  set("metaCategory", product.category);

  // Get condition from specifications array
  const conditionSpec = product.specifications?.find(s => s.key === "condition");
  set("metaCondition", conditionSpec?.value || product.condition || "");

  // Location
  set("metaLocation", product.location || "");

  // Calculate posted date from createdAt
  if (product.createdAt) {
    const created = new Date(product.createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let posted = "";
    if (diffDays === 0) posted = "Today";
    else if (diffDays === 1) posted = "Yesterday";
    else if (diffDays < 7) posted = `${diffDays} days ago`;
    else if (diffDays < 30) posted = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    else if (diffDays < 365) posted = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
    else posted = `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`;
    set("metaPosted", posted);
  }

  // Specs list from real API
  const specsList = document.querySelector(".specs-list");
  if (specsList && product.specifications?.length) {
    specsList.innerHTML = product.specifications.map(s =>
      `<li><strong>${s.label}:</strong> ${s.value}</li>`
    ).join("");
  } else if (specsList && product.specs?.length) {
    specsList.innerHTML = product.specs.map(s => `<li>${s}</li>`).join("");
  }

  // Location from real API
  const set2 = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };
  set2("metaLocation", product.location || product.seller?.location || "");

  // Logistics section
  const logisticsSection = document.querySelector(".logistics-section");
  if (logisticsSection && product.logistics?.length) {
    logisticsSection.innerHTML = product.logistics.map(l =>
      `<p><strong>${l.label}:</strong> ${l.value}</p>`
    ).join("");
  }

  // Component condition
  const conditionList = document.querySelector(".condition-list");
  if (conditionList && product.componentCondition?.length) {
    conditionList.innerHTML = product.componentCondition.map(c =>
      `<li><span class="status-dot ${c.color}"></span> ${c.name}: ${c.status}</li>`
    ).join("");
  }

  // Overall condition
  const overallEl = document.querySelector(".overall-rating");
  if (overallEl && product.overallCondition) {
    overallEl.innerHTML = `<i class="fa-solid fa-star"></i> Overall: ${product.overallCondition}`;
  }
}

export function renderGallery(product, elements) {
  const { track, dotsContainer, thumbsContainer } = elements;
  
  let images = product.images?.filter(Boolean) || [];
  if (images.length === 1) {
    images = [images[0], images[0], images[0]];
  }
  if (!images.length) return;

  let index = 0;
  let dots = [];

  track.innerHTML = images.map(img => `
    <div class="gallery__slide" style="min-width: 100%; flex: 0 0 100%; box-sizing: border-box;">
      <img src="${img.url || ""}" alt="${product?.title || "Product image"}" style="width: 100%; display: block; object-fit: cover;">
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

function createCard(p) {
  return `
    <div class="product-card">
      <div class="product-card__img-container">
        <span class="product-card__profile-badge"><i class="fa-solid fa-circle-user"></i></span>
        <button class="product-card__heart-btn"><i class="fa-regular fa-heart"></i></button>
        <img src="${p.images?.[0]?.url || ""}" alt="${p.title}">
      </div>
      <div class="product-card__content">
        <div class="product-card__header-row">
          <div class="product-card__titles">
            <h3>${p.title}</h3>
            <p class="product-card__tagline">${p.description?.slice(0, 40) || ""}...</p>
          </div>
          <span class="product-card__price">$${Number(p.price).toLocaleString()}</span>
        </div>
        <div class="product-card__details">
          <div class="product-card__detail-item">
            <i class="fa-regular fa-thumbs-up"></i> ${p.condition || "Like new"}
          </div>
          <div class="product-card__detail-item location">
            <i class="fa-solid fa-location-dot"></i> ${p.location || ""}
          </div>
        </div>
        <button class="product-card__chat-btn"
          data-phone="${p.seller?.whatsapp || ""}"
          data-title="${p.title}">
          <i class="fa-brands fa-whatsapp"></i> Whatsapp
        </button>
      </div>
    </div>`;
}

export function renderSimilarProducts(similarProducts, bestSellers) {
  const grids = document.querySelectorAll(".similar-products__grid");
  if (!grids.length) return;
  if (grids[0]) grids[0].innerHTML = similarProducts.map(p => createCard(p)).join("");
  if (grids[1]) grids[1].innerHTML = (bestSellers || similarProducts).map(p => createCard(p)).join("");
}

export function setupInteractions(currentProduct) {
  let qty = 1;
  const qtyEl = document.getElementById("qty");

  // Show more/less toggle
  const toggleBtn = document.getElementById("showToggle");
  const specsSection = document.querySelector(".specifications-section");
  const logisticsSection = document.querySelector(".logistics-section");
  const priceBox = document.querySelector(".price-comparison-box");
  const conditionCard = document.querySelector(".component-condition-card");
  let isExpanded = false;

  // Set default collapsed state
  const collapsibles = [specsSection, logisticsSection, priceBox, conditionCard];
  collapsibles.forEach(el => {
    if (el) {
      el.style.overflow = "hidden";
      el.style.maxHeight = "0";
      el.style.marginTop = "0";
      el.style.paddingTop = "0";
      el.style.paddingBottom = "0";
      el.style.transition = "max-height 0.7s cubic-bezier(0.4, 0, 0.2, 1), padding 0.7s ease, margin 0.7s ease";
    }
  });

  if (toggleBtn) {
    toggleBtn.innerHTML = `Show more <i class="fa-solid fa-chevron-down"></i>`;

    toggleBtn.addEventListener("click", () => {
      isExpanded = !isExpanded;
      collapsibles.forEach(el => {
        if (el) {
          el.style.maxHeight = isExpanded ? "2000px" : "0";
          el.style.marginTop = isExpanded ? "" : "0";
          el.style.paddingTop = isExpanded ? "" : "0";
          el.style.paddingBottom = isExpanded ? "" : "0";
        }
      });
      toggleBtn.innerHTML = isExpanded
        ? `Show less <i class="fa-solid fa-chevron-up"></i>`
        : `Show more <i class="fa-solid fa-chevron-down"></i>`;
    });
  }

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

  document.addEventListener("click", (e) => {
    const heartBtn = e.target.closest(".product-card__heart-btn");
    if (!heartBtn) return;
    const saved = heartBtn.classList.toggle("is-saved");
    heartBtn.innerHTML = saved
      ? `<i class="fa-solid fa-heart" style="color:#e11d48"></i>`
      : `<i class="fa-regular fa-heart"></i>`;
  });

  const wishlist = document.getElementById("wishlist");
  wishlist?.addEventListener("click", () => {
    const saved = wishlist.classList.toggle("is-saved");
    wishlist.innerHTML = saved
      ? `<i class="fa-solid fa-heart" style="color:#e11d48"></i>`
      : `<i class="fa-regular fa-heart"></i>`;
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
  const main = document.querySelector(".product-detail");
  if (main) {
    main.innerHTML = `
      <div style="padding:60px 20px;text-align:center;font-family:inherit">
        <p><strong>Waking up the server...</strong></p>
        <p style="color:#6b7280;font-size:0.9rem">This usually takes 2-3 minutes on first load. Stay on this page!</p>
        <div class="page-loader__spinner" style="margin:20px auto;"></div>
      </div>
    `;
  }
}
