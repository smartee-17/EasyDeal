import { fetchProductById, fetchRelatedProducts } from "./api.js";
import { 
  renderProductInfo, 
  renderGallery, 
  renderSimilarProducts, 
  setupInteractions,
  renderInvalidLink, 
  renderServerWakeup 
} from "./render.js";

const params = new URLSearchParams(window.location.search);
const productID = params.get("id");


document.addEventListener("DOMContentLoaded", init);

async function init() {
  if (!productID || productID === "undefined" || productID === "null") {
    document.getElementById("loader")?.classList.add("is-hidden");
    setupInteractions({});
    return;
  }

  try {
    const currentProduct = await fetchProductById(productID);
    if (!currentProduct) throw new Error("No product found in database");

    let products = [];
    try {
      products = await fetchRelatedProducts();
    } catch (e) {
      console.warn("Failed to load similar products seamlessly:", e);
    }

    document.getElementById("loader")?.classList.add("is-hidden");

    renderProductInfo(currentProduct, {
      titleEl: document.querySelector(".product-info__title"),
      priceEl: document.querySelector(".price__current"),
      descEl: document.getElementById("productDescription")
    });

    renderGallery(currentProduct, {
      track: document.getElementById("galleryTrack"),
      dotsContainer: document.createElement("div"),
      thumbsContainer: document.querySelector(".gallery__thumbs")
    });

    renderSimilarProducts(products || [], products || []);
    setupInteractions(currentProduct);

  } catch (err) {
    console.error("Initialization Failed:", err);
    document.getElementById("loader")?.classList.add("is-hidden");
    const main = document.querySelector(".product-detail");
    if (main) {
      main.innerHTML = `
        <div style="padding:40px;text-align:center;font-family:inherit">
          <h3>Error loading product</h3>
          <p style="color:red;font-size:0.85rem;word-break:break-all">${err.message}</p>
        </div>
      `;
    }
  }
}
