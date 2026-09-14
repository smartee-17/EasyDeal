const description = document.querySelector('.basic-info__textarea');
const counter = document.querySelector('.basic-info__counter');

if (description) {
  const updateDescription = () => {
    const characters = description.value.length;
    const maxCharacters = 500;

    /* Update character counter */
    if (counter) {
      counter.textContent = `${characters} / ${maxCharacters}`;
    }

    /* Show scrollbar when 90% full */
    const showScrollbar = characters >= maxCharacters * 0.9;

    description.classList.toggle(
      'is-scrollable',
      showScrollbar
    );
  };

  description.addEventListener('input', updateDescription);

  updateDescription();
}