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

      const categoryText = option
        .querySelector('span')
        ?.textContent
        .trim() || option.textContent.trim();

      categoryButton.querySelector('span').textContent =
        categoryText;

      categoryMenu.classList.remove('is-open');

      categoryButton.setAttribute(
        'aria-expanded',
        'false'
      );
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