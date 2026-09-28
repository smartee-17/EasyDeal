import { createProduct } from "./api.js";

const description = document.querySelector('.basic-info__textarea');
const counter = document.querySelector('.basic-info__counter');
if (description) {
  const updateDescription = () => {
    const characters = description.value.length;
    const maxCharacters = 500;

    if (counter) {
      counter.textContent = `${characters} / ${maxCharacters}`;
    }

    const showScrollbar = characters >= maxCharacters * 0.9;

    description.classList.toggle(
      'is-scrollable',
      showScrollbar
    );
  };

  description.addEventListener('input', updateDescription);

  updateDescription();
}


const dropdowns = document.querySelectorAll('.product-dropdown');
dropdowns.forEach((dropdown) => {
  const button = dropdown.querySelector('.product-dropdown__button');
  const menu = dropdown.querySelector('.product-dropdown__menu');
  const options = dropdown.querySelectorAll('.product-dropdown__option');

  if (!button || !menu) return;

  button.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');

    button.setAttribute('aria-expanded', isOpen);

    dropdowns.forEach((otherDropdown) => {
      if (otherDropdown !== dropdown) {
        const otherMenu = otherDropdown.querySelector(
          '.product-dropdown__menu'
        );

        const otherButton = otherDropdown.querySelector(
          '.product-dropdown__button'
        );

        if (otherMenu && otherButton) {
          otherMenu.classList.remove('is-open');
          otherButton.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const selectedText = option.textContent.trim();
      const buttonText = button.querySelector('span');
      if (buttonText) {
        buttonText.textContent = selectedText;
      }
      menu.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    });
  });
});

document.addEventListener('click', (event) => {
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(event.target)) {
      const menu = dropdown.querySelector(
        '.product-dropdown__menu'
      );
      const button = dropdown.querySelector(
        '.product-dropdown__button'
      );

      if (menu && button) {
        menu.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
      }
    }
  });
});


const categoryButton = document.querySelector(
  '.basic-info__category'
);
const categoryMenu = document.querySelector(
  '.basic-info__category-menu'
);
const categoryOptions = document.querySelectorAll(
  '.basic-info__category-option'
);
if (categoryButton && categoryMenu) {
  categoryButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = categoryMenu.classList.toggle('is-open');
    categoryButton.setAttribute(
      'aria-expanded',
      isOpen
    );
  });

  categoryOptions.forEach((option) => {
    option.addEventListener('click', () => {
    const categoryValue = option.dataset.value;
    const categoryText =
      option.querySelector('span')?.textContent.trim() ||
      option.textContent.trim();
    categoryButton.querySelector('span').textContent =
      categoryText;
    categoryButton.dataset.value = categoryValue;
    categoryMenu.classList.remove('is-open');
    categoryButton.setAttribute(
      'aria-expanded',
      'false'
    );

    renderSpecificationFields(categoryValue);
  });
});

  document.addEventListener('click', (event) => {
    if (
      !categoryButton.contains(event.target) &&
      !categoryMenu.contains(event.target)
    ) {
      categoryMenu.classList.remove('is-open');

      categoryButton.setAttribute(
        'aria-expanded',
        'false'
      );
    }
  });
}

const publishButton = document.querySelector("#publish-listing");

if (publishButton) {
  publishButton.addEventListener("click", async () => {
    const title = document.querySelector("#product-name")?.value.trim();
    const description = document.querySelector("#product-description")?.value.trim();
    const price = document.querySelector("#original-price")?.value.trim();
    const location = document.querySelector("#location")?.value.trim();

    const categoryButton = document.querySelector("#product-category");
    const category = categoryButton?.dataset.value;

    const fileInput = document.querySelector(".basic-info__file-input");
    const imageFiles = fileInput
      ? Array.from(fileInput.files)
      : [];

    if (!title || !description || !category || !price || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    const specificationValidation =
     validateSpecifications(category);
     if (!specificationValidation.valid) {
       alert(specificationValidation.message);
       return;
     }

     const specifications = collectSpecifications();

    const product = {
      title,
      description,
      category,
      price,
      location,
      tags: selectedTags,
      specifications
    };

    try {
      publishButton.disabled = true;
      publishButton.textContent = "Publishing...";

      const createdProduct = await createProduct(
        product,
        imageFiles
      );

      console.log("Product created:", createdProduct);

      alert("Product published successfully!");

    } catch (error) {
      console.error("Failed to publish product:", error);
      alert(error.message);

    } finally {
      publishButton.disabled = false;
      publishButton.textContent = "Publish Listing";
    }
  });
}

const uploadButton = document.querySelector(".basic-info__upload-button");
const fileInput = document.querySelector(".basic-info__file-input");
const imagePreview = document.querySelector("#image-preview");

let selectedImages = [];

if (uploadButton && fileInput) {
  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    const newFiles = Array.from(fileInput.files);

    if (selectedImages.length + newFiles.length > 5) {
      alert("You can upload a maximum of 5 images.");
      return;
    }

    selectedImages = [
      ...selectedImages,
      ...newFiles
    ];

    renderImagePreview();
  });
}

function renderImagePreview() {
  if (!imagePreview) return;

  imagePreview.innerHTML = "";

  selectedImages.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = () => {
      const imageWrapper = document.createElement("div");
      imageWrapper.className = "basic-info__preview-item";

      imageWrapper.innerHTML = `
        <img
          src="${reader.result}"
          alt="Product image ${index + 1}"
          class="basic-info__preview-image"
        >

        <button
          type="button"
          class="basic-info__preview-remove"
          aria-label="Remove image"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      imageWrapper
        .querySelector(".basic-info__preview-remove")
        .addEventListener("click", () => {
          selectedImages.splice(index, 1);
          renderImagePreview();
        });

      imagePreview.appendChild(imageWrapper);
    };

    reader.readAsDataURL(file);
  });
}

const tagInput = document.querySelector("#product-tags-input");
const tagList = document.querySelector(".product-tags__list");

let selectedTags = [];

if (tagInput) {
  tagInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const tag = tagInput.value.trim();

    if (!tag) return;

    addTag(tag);

    tagInput.value = "";
  });
}

function addTag(tag) {
  const cleanTag = tag
    .replace(/^#/, "")
    .trim();

  if (!cleanTag) return;

  const exists = selectedTags.some(
    (existingTag) =>
      existingTag.toLowerCase() === cleanTag.toLowerCase()
  );

  if (exists) return;

  if (selectedTags.length >= 5) {
    alert("You can add a maximum of 5 tags.");
    return;
  }

  selectedTags.push(cleanTag);

  renderTags();
}

function removeTag(tag) {
  selectedTags = selectedTags.filter(
    (selectedTag) => selectedTag !== tag
  );

  renderTags();
}

function renderTags() {
  if (!tagList) return;

  tagList.innerHTML = "";

  selectedTags.forEach((tag) => {
    const tagButton = document.createElement("button");

    tagButton.type = "button";
    tagButton.className = "product-tags__tag";

    tagButton.innerHTML = `
      <span># ${tag}</span>
      <i class="fa-solid fa-xmark"></i>
    `;

    tagButton.addEventListener("click", () => {
      removeTag(tag);
    });

    tagList.appendChild(tagButton);
  });
}


const recommendedTags =
  document.querySelectorAll(".product-tags__tag");

recommendedTags.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const tagText = button
      .querySelector("span")
      ?.textContent
      .replace("#", "")
      .trim();

    if (tagText) {
      addTag(tagText);
    }
  });
});


const specificationFields = {
  electronics: [
    {
      name: "condition",
      label: "Condition",
      type: "select",
      required: true,
      options: [
        "Brand new",
        "Like new",
        "Good condition",
        "Fair condition",
        "Used"
      ]
    },
    {
      name: "brand",
      label: "Brand",
      type: "text",
      required: true
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      required: false
    }
  ],

  clothing: [
    {
      name: "condition",
      label: "Condition",
      type: "select",
      required: true,
      options: [
        "Brand new",
        "Like new",
        "Good condition",
        "Fair condition",
        "Used"
      ]
    },
    {
      name: "brand",
      label: "Brand",
      type: "text",
      required: true
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      required: false
    }
  ],

  furniture: [
    {
      name: "condition",
      label: "Condition",
      type: "select",
      required: true,
      options: [
        "Brand new",
        "Like new",
        "Good condition",
        "Fair condition",
        "Used"
      ]
    },
    {
      name: "brand",
      label: "Brand",
      type: "text",
      required: true
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      required: false
    }
  ],

  books: [
    {
      name: "condition",
      label: "Condition",
      type: "select",
      required: true,
      options: [
        "Brand new",
        "Like new",
        "Good condition",
        "Fair condition",
        "Used"
      ]
    },
    {
      name: "brand",
      label: "Brand",
      type: "text",
      required: true
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      required: false
    }
  ],

  sports: [
    {
      name: "condition",
      label: "Condition",
      type: "select",
      required: true,
      options: [
        "Brand new",
        "Like new",
        "Good condition",
        "Fair condition",
        "Used"
      ]
    },
    {
      name: "brand",
      label: "Brand",
      type: "text",
      required: true
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      required: false
    }
  ]
};


const detailFieldsContainer =
  document.querySelector("#product-detail-fields");

function renderSpecificationFields(category) {
  if (!detailFieldsContainer) return;

  const fields = specificationFields[category];

  if (!fields) {
    detailFieldsContainer.innerHTML = `
      <p class="product-detail__empty">
        Product details for this category haven't been defined yet.
      </p>
    `;
    return;
  }

  detailFieldsContainer.innerHTML = "";

  fields.forEach((field) => {
  const fieldWrapper = document.createElement("div");
  fieldWrapper.className = "product-detail__field";

  if (field.type === "select") {
    fieldWrapper.innerHTML = `
      <label for="spec-${field.name}">
        ${field.label}
      </label>

      <div class="product-dropdown product-detail__dropdown">
        <button
          type="button"
          class="product-dropdown__button"
          aria-expanded="false"
        >
          <i class="fa-solid fa-chevron-down product-dropdown__arrow"></i>
          <span>Select ${field.label}</span>
        </button>

        <div class="product-dropdown__menu">
          ${field.options
            .map(
              (option) => `
                <button
                  type="button"
                  class="product-dropdown__option"
                  data-value="${option}"
                >
                  ${option}
                </button>
              `
            )
            .join("")}
        </div>

        <input
          type="hidden"
          id="spec-${field.name}"
          name="${field.name}"
          data-specification="${field.name}"
          value=""
        />
      </div>
    `;
  } else {
    fieldWrapper.innerHTML = `
      <label for="spec-${field.name}">
        ${field.label}
      </label>

      <div class="product-detail__input-row">
        <input
          type="text"
          id="spec-${field.name}"
          name="${field.name}"
          data-specification="${field.name}"
          ${field.required ? "required" : ""}
        >

        <button
          type="button"
          class="product-detail__remove"
          aria-label="Remove ${field.label}"
          data-remove-field="${field.name}"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
  }

  detailFieldsContainer.appendChild(fieldWrapper);
});

const addButton = document.createElement("button");

addButton.type = "button";
addButton.className = "product-detail__add";

addButton.innerHTML = `
  <i class="fa-solid fa-plus"></i>
  <span>Add</span>
`;

detailFieldsContainer.appendChild(addButton);

setupProductDetailDropdowns();
setupProductDetailRemoveButtons();
}

function setupProductDetailDropdowns() {
  const dropdowns = detailFieldsContainer.querySelectorAll(
    ".product-detail__dropdown"
  );
  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector(
      ".product-dropdown__button"
    );
    const menu = dropdown.querySelector(
      ".product-dropdown__menu"
    );
    const options = dropdown.querySelectorAll(
      ".product-dropdown__option"
    );
    const hiddenInput = dropdown.querySelector(
      "[data-specification]"
    );
    if (!button || !menu || !hiddenInput) return;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen =
        menu.classList.toggle("is-open");
      button.setAttribute(
        "aria-expanded",
        isOpen
      );
      dropdowns.forEach((otherDropdown) => {
        if (otherDropdown === dropdown) return;
        const otherMenu =
          otherDropdown.querySelector(
            ".product-dropdown__menu"
          );
        const otherButton =
          otherDropdown.querySelector(
            ".product-dropdown__button"
          );
        if (otherMenu && otherButton) {
          otherMenu.classList.remove("is-open");
          otherButton.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      });
    });
    options.forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.dataset.value;
        const text = option.textContent.trim();
        const buttonText =
          button.querySelector("span");
        if (buttonText) {
          buttonText.textContent = text;
        }
        hiddenInput.value = value;
        menu.classList.remove("is-open");
        button.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    });
  });
}

function setupProductDetailRemoveButtons() {
  const removeButtons = detailFieldsContainer.querySelectorAll(
    "[data-remove-field]"
  );
  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const fieldName = button.dataset.removeField;
      const input = detailFieldsContainer.querySelector(
        `[data-specification="${fieldName}"]`
      );

      if (input) {
        input.value = "";
        input.focus();
      }
    });
  });
}

function collectSpecifications() {
  if (!detailFieldsContainer) return [];

  const fields = detailFieldsContainer.querySelectorAll(
    "[data-specification]"
  );

  const specifications = [];

  fields.forEach((field) => {
    const name = field.dataset.specification;
    const value = field.value.trim();

    if (!value) return;

    specifications.push({
      name,
      value
    });
  });

  return specifications;
}

function validateSpecifications(category) {
  const fields = specificationFields[category];
  if (!fields) {
    return {
      valid: true,
      message: ""
    };
  }
  for (const field of fields) {
    if (!field.required) continue;
    const input = detailFieldsContainer?.querySelector(
      `[data-specification="${field.name}"]`
    );
    if (!input || !input.value.trim()) {
      return {
        valid: false,
        message: `${field.label} is required.`
      };
    }
  }
  return {
    valid: true,
    message: ""
  };
}


const previewButton =
  document.querySelector("#preview-product");
const previewModal =
  document.querySelector("#product-preview");
const closePreviewButton =
  document.querySelector("#close-product-preview");
const previewOverlay =
  document.querySelector(".product-preview__overlay");


function openPreview() {
  if (!previewModal) return;
  const title =
    document.querySelector("#product-name")?.value.trim();
  const description =
    document.querySelector("#product-description")?.value.trim();
  const price =
    document.querySelector("#original-price")?.value.trim();
  const location =
    document.querySelector("#location")?.value.trim();
  const categoryButton =
    document.querySelector("#product-category");
  const category =
    categoryButton?.querySelector("span")?.textContent.trim();
  const specifications =
    collectSpecifications();
  const titleElement =
    document.querySelector("#preview-title");
  const descriptionElement =
    document.querySelector("#preview-description");
  const priceElement =
    document.querySelector("#preview-price");
  const locationElement =
    document.querySelector("#preview-location");
  const categoryElement =
    document.querySelector("#preview-category");
  if (titleElement) {
    titleElement.textContent =
      title || "Untitled product";
  }
  if (descriptionElement) {
    descriptionElement.textContent =
      description || "No description provided.";
  }
  if (priceElement) {
    priceElement.textContent =
      price ? `$${price}` : "Price not set";
  }
  if (locationElement) {
    locationElement.textContent =
      location || "Location not set";
  }
  if (categoryElement) {
    categoryElement.textContent =
      category || "No category";
  }

  renderPreviewSpecifications(specifications);
  renderPreviewTags();
  renderPreviewImages();
  previewModal.classList.add("is-open");
  previewModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("preview-open");
}

function renderPreviewSpecifications(specifications) {
  const container =
    document.querySelector("#preview-specifications");
  if (!container) return;
  container.innerHTML = "";
  if (!specifications.length) {
    return;
  }
  const heading = document.createElement("h3");
  heading.textContent = "Product details";
  container.appendChild(heading);
  specifications.forEach((specification) => {
    const item = document.createElement("div");
    item.className =
      "product-preview__specification";
    item.innerHTML = `
      <span>${formatSpecificationName(
        specification.name
      )}</span>
      <strong>${specification.value}</strong>
    `;
    container.appendChild(item);
  });
}

function formatSpecificationName(name) {
  return name
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function renderPreviewTags() {
  const container =
    document.querySelector("#preview-tags");
  if (!container) return;
  container.innerHTML = "";
  if (!selectedTags.length) {
    return;
  }
  selectedTags.forEach((tag) => {
    const element =
      document.createElement("span");
    element.className =
      "product-preview__tag";
    element.textContent = `# ${tag}`;
    container.appendChild(element);
  });
}

function renderPreviewImages() {
  const mainImage =
    document.querySelector("#preview-main-image");

  const thumbnails =
    document.querySelector("#preview-thumbnails");

  if (!mainImage || !thumbnails) return;

  mainImage.innerHTML = "";
  thumbnails.innerHTML = "";

  if (!selectedImages.length) {
    mainImage.innerHTML = "<span>No image</span>";
    return;
  }

  const imageURLs = selectedImages.map((file) =>
    URL.createObjectURL(file)
  );

  const showImage = (url) => {
    mainImage.innerHTML = `
      <img
        src="${url}"
        alt="Product preview"
      >
    `;
  };

  showImage(imageURLs[0]);
  imageURLs.forEach((url, index) => {
    const thumbnail =
      document.createElement("button");
    thumbnail.type = "button";
    thumbnail.className =
      "product-preview__thumbnail";
    thumbnail.innerHTML = `
      <img
        src="${url}"
        alt="Product image ${index + 1}"
      >
    `;
    thumbnail.addEventListener("click", () => {
      showImage(url);
    });
    thumbnails.appendChild(thumbnail);
  });
}

function closePreview() {
  if (!previewModal) return;
  previewModal.classList.remove("is-open");
  previewModal.setAttribute(
    "aria-hidden",
    "true"
  );
  document.body.classList.remove("preview-open");
}
if (previewButton) {
  previewButton.addEventListener(
    "click",
    openPreview
  );
}
if (closePreviewButton) {
  closePreviewButton.addEventListener(
    "click",
    closePreview
  );
}
if (previewOverlay) {
  previewOverlay.addEventListener(
    "click",
    closePreview
  );
}