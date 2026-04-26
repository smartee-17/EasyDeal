const products = document.querySelector(".products");
const categories = document.querySelector(".category-bar__list");

async function fetchData() {
  let res = await fetch("products.json");
  let data = await res.json();
  data.map((a) => {
    products.innerHTML += `
            <div class="product-card" id = ${a.id}>
          <img
            class="product-card__image"
            src= "${a.image}"
            alt="Mouse"
          />
          <h3 class="product-card__title">${a.name}</h3>

          <p class="product-card__price product-card__price--sale">${a.price}</p>

          <button class="product-card__button product-card__button--primary">
            Add to Cart
          </button>
        </div>
    `;
  });
  let category = [...new Set(data.map((items) => items.category))];
  category.unshift("All Products");
  console.log(category);
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
            <div class="product-card" id = ${a.id}>
          <img
            class="product-card__image"
            src= "${a.image}"
            alt="Mouse"
          />
          <h3 class="product-card__title">${a.name}</h3>

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
            <div class="product-card" id = ${d.id}>
          <img
            class="product-card__image"
            src= "${d.image}"
            alt="Mouse"
          />
          <h3 class="product-card__title">${d.name}</h3>

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
