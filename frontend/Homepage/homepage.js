const categories = document.querySelector(".category-bar__list");
const products = document.querySelector(".products");

async function fetchData() {
  let res = await fetch("products.json");
  let result = await res.json();
  let data = result.data;
  products.innerHTML = "";
  data.map((a) => {
    products.innerHTML += `
            <div class="product-card" id = ${a._id}>
          <img
            class="product-card__image"
            src= "${a.images[0]}"
            alt="${a.altText}"
          />
          <h3 class="product-card__title">${a.title}</h3>

          <p class="product-card__price product-card__price--sale">${a.price}</p>

          <button class="product-card__button product-card__button--primary">
            Add to Cart
          </button>
        </div>
    `;
  });
  let category = [...new Set(data.map((items) => items.category))];
  category.unshift("All Products");

  const categoryHTML = category
    .map((cat) => {
      return ` <li class="category-bar__item">${cat}</li>`;
    })
    .join("");
  categories.innerHTML += categoryHTML;

  let categoryList = document.querySelectorAll(".category-bar__item");
  categoryList.forEach((a) => {
    if (a.textContent === "All Products") {
      a.classList.add("active");
    }
    a.addEventListener("click", () => {
      categoryList.forEach((btn) => {
        btn.classList.remove("active");
      });

      a.classList.add("active");

      products.innerHTML = "";
      if (a.textContent === "All Products") {
        data.map((a) => {
          products.innerHTML += `
            <div class="product-card" id = ${a._id}>
          <img
            class="product-card__image"
            src= "${a.images[0]}"
            alt="${a.altText}"
          />
          <h3 class="product-card__title">${a.title}</h3>

          <p class="product-card__price product-card__price--sale">${a.price}</p>

          <button class="product-card__button product-card__button--primary">
            Add to Cart
          </button>
        </div>
    `;
        });
      }
      data.map((d) => {
        if (d.category === a.textContent) {
          products.innerHTML += `
            <div class="product-card" id = ${d._id}>
          <img
            class="product-card__image"
            src= "${d.images[0]}"
            alt="${d.altText}"
          />
          <h3 class="product-card__title">${d.title}</h3>

          <p class="product-card__price product-card__price--sale">${d.price}</p>

          <button class="product-card__button product-card__button--primary">
            Add to Cart
          </button>
        </div>
    `;
        }
      });
    });
  });
}
fetchData();
