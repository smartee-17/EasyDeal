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
    renderInvalidLink();
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
      dotsContainer: document.getElementById("dots"),
      thumbsContainer: document.querySelector(".gallery__thumbs")
    });

    renderSimilarProducts(products || []);
    setupInteractions(currentProduct);

  } catch (err) {
    console.error("Initialization Failed:", err);
    document.getElementById("loader")?.classList.add("is-hidden");
    renderServerWakeup();
    setTimeout(() => {
        window.location.href = window.location.href;
        }, 10000);
  }
}
