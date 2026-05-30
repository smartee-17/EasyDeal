class MainHeader extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
    <style>
    .header {
  display: flex;
  padding: 20px;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.header__img {
  width: 150px;
  height: auto;
}
.header__search {
  width: 100%;
  max-width: 400px;
  font-size: 1rem;
  border-radius: 50px;
  border: 1px solid var(--color-border);
  padding: 12px 20px;
  outline: none;
}
    </style>
    <header class="header">
      <img
        src="../assets/images/logos/logo-light-rect.svg"
        alt="Easy Deal logo"
        class="header__img"
      />
      <input type="search" class="header__search" placeholder="search" />
    </header>
    `;
  }
}
customElements.define("main-header", MainHeader);
