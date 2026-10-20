/* ============================================================
   EASYDEAL — ACCOUNT DROPDOWN
   Purpose: The username dropdown is the navigation hub for a signed-in
            visitor, on desktop and on mobile.

   What is in the menu
   The menu is the navbar's page list: the Homepage, the saved-items page,
   and — for sellers only — the signed-in user's own seller page. Entries
   exist only for pages that exist; when new pages arrive, add them to
   MENU_GROUPS below.

   Role source
   The role is read from the user object returned by authService
   getCurrentUser(), which reads the HttpOnly session cookie server-side.
   It is never inferred from the URL, from storage, or from a local flag.
   Menu visibility is therefore a presentation concern only: it decides
   what a visitor is offered, never what the backend will allow. Every
   protected endpoint re-checks the role server-side.

   Role values match the backend enum: 'user' | 'seller' | 'admin'.

   Why not Admin
   The public navbar does not carry Admin navigation. Admin is reached
   through the post-login role route in Auth/Shared/redirect.js, and the
   Admin app has its own shell, navbar and auth guard. Surfacing
   Admin-only destinations in the public bar would link people into a
   shell that is not designed to be entered from here.
   ============================================================ */

import {
  iconHeart,
  iconHome,
  iconLogout,
  iconStore,
} from "../icons/icons.js";

/** The Homepage is the search results destination; see
 *  header-session.js for why the query is answered there. */
const HOMEPAGE_URL = "/frontend/Homepage/homepage.html";

/** Destinations, grouped. Only real pages appear here.
 *  `roles: null` means every signed-in role sees the group. */
const MENU_GROUPS = [
  {
    id: "shopping",
    label: "Shopping",
    roles: null,
    items: [
      {
        // The page list starts at the Homepage. It was declared here as
        // HOMEPAGE_URL but never referenced by an item, so the menu offered
        // no way back to the front page from anywhere else in the site.
        id: "home",
        label: "Home",
        href: HOMEPAGE_URL,
        icon: iconHome,
      },
      {
        id: "saved-products",
        label: "Saved Products",
        href: "/frontend/save-product/saveProduct.html",
        icon: iconHeart,
      },
    ],
  },
  {
    id: "selling",
    label: "Selling",
    /* Seller-only. The role comes from the session returned by
       authService.getCurrentUser(), never from the URL or storage.
       Hiding the link is presentation only: the backend re-checks every
       protected route. */
    roles: ["seller"],
    items: [
      {
        id: "my-seller-page",
        label: "My seller page",
        href: ({ userId }) =>
          `/frontend/Seller%20profile%20page/sellerp.html?id=${encodeURIComponent(userId)}`,
        icon: iconStore,
      },
    ],
  },
  {
    id: "session",
    label: "Session",
    roles: null,
    items: [{ id: "logout", label: "Log out", icon: iconLogout, danger: true }],
  },
];

/** Roles allowed to see a group. `null` means everyone signed in. */
function groupAppliesTo(group, role) {
  if (!group.roles) return true;
  return group.roles.includes(role);
}

/**
 * Build the menu for one user.
 *
 * Groups with no items after filtering are dropped entirely, so an empty
 * "Selling" heading can never appear for a buyer.
 *
 * @param {{id?: string, role?: string}} user
 * @returns {Array<{id: string, label: string, items: Array}>}
 */
export function buildMenuGroups(user) {
  const role = user?.role ?? null;
  const userId = user?._id ?? user?.id ?? '';

  return MENU_GROUPS.map((group) => {
    if (!groupAppliesTo(group, role)) return null;

    const items = group.items
      .map((item) => {
        // The logout entry is an action, not a navigation.
        if (item.id === 'logout') return { ...item, action: 'logout' };

        const href =
          typeof item.href === 'function' ? item.href({ userId }) : item.href;

        return { ...item, href };
      })
      .filter((item) => !('href' in item) || Boolean(item.href));

    return items.length > 0 ? { id: group.id, label: group.label, items } : null;
  }).filter(Boolean);
}

/* ── Rendering ──────────────────────────────────────────────── */

function renderItem(item) {
  const isAction = Boolean(item.action);

  const element = document.createElement(isAction ? 'button' : 'a');
  if (isAction) {
    element.type = 'button';
  } else {
    element.href = item.href;
  }

  element.className = 'header__menu-item';
  if (item.danger) element.classList.add('header__menu-item--danger');
  element.dataset.menuItem = item.id;
  element.setAttribute('role', 'menuitem');
  if (isAction) element.setAttribute('aria-label', item.label);

  const icon = document.createElement('span');
  icon.className = 'header__menu-item-icon';
  icon.setAttribute('aria-hidden', 'true');
  // Locally generated icon markup from the project's own library.
  icon.innerHTML = item.icon({ size: 16 });
  element.append(icon);

  const label = document.createElement('span');
  label.textContent = item.label;
  element.append(label);

  return element;
}

/** Replace the panel's contents with the menu for this user. */
export function renderMenu(menu, user) {
  menu.replaceChildren();

  for (const group of buildMenuGroups(user)) {
    const groupElement = document.createElement('div');
    groupElement.className = 'header__menu-group';
    groupElement.setAttribute('role', 'group');
    groupElement.setAttribute('aria-label', group.label);

    const label = document.createElement('div');
    label.className = 'header__menu-label';
    // The group heading is decorative: each item's accessible name is its
    // own text, and the heading would otherwise be announced twice.
    label.setAttribute('aria-hidden', 'true');
    label.textContent = group.label;
    groupElement.append(label);

    for (const item of group.items) groupElement.append(renderItem(item));

    menu.append(groupElement);
  }
}

/* ── Open / close ───────────────────────────────────────────── */

function itemsOf(menu) {
  return [...menu.querySelectorAll('[data-menu-item]')];
}

/**
 * Wire the trigger and panel for one header.
 *
 * Handles the whole interaction surface in one place so opening and
 * closing can never disagree: click, Escape, outside click, focus leaving,
 * and the arrow keys.
 *
 * @param {{trigger: HTMLElement, menu: HTMLElement,
 *          onLogout: Function, onNavigate: Function}} handlers
 * @returns {() => void} teardown
 */
export function attachAccountMenu({ trigger, menu, onLogout, onNavigate }) {
  let open = false;

  const setOpen = (next) => {
    open = next;
    menu.hidden = !next;
    trigger.setAttribute('aria-expanded', next ? 'true' : 'false');
    if (!next) clearActive();
  };

  const activeIndex = () => {
    const items = itemsOf(menu);
    return items.findIndex((el) => el.dataset.active === 'true');
  };

  const clearActive = () => {
    for (const el of itemsOf(menu)) delete el.dataset.active;
  };

  /** Move the ring without moving real DOM focus, so Escape still
   *  returns focus to the trigger. */
  const setActive = (index) => {
    const items = itemsOf(menu);
    if (items.length === 0) return;
    const clamped = ((index % items.length) + items.length) % items.length;
    clearActive();
    items[clamped].dataset.active = 'true';
    items[clamped].scrollIntoView({ block: 'nearest' });
  };

  const openMenu = ({ focusFirst = false } = {}) => {
    setOpen(true);
    if (focusFirst) setActive(0);
  };

  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!open) return;
    setOpen(false);
    if (restoreFocus) trigger.focus();
  };

  const onTriggerClick = (event) => {
    event.preventDefault();
    if (open) {
      closeMenu({ restoreFocus: true });
    } else {
      openMenu();
    }
  };

  const onDocumentClick = (event) => {
    if (!open) return;
    // A click inside the account area is the trigger's own click and is
    // already handled; anything else closes.
    if (trigger.contains(event.target) || menu.contains(event.target)) return;
    closeMenu();
  };

  const onKeydown = (event) => {
    if (!open) {
      // Let the trigger handle Enter and Space natively.
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeMenu({ restoreFocus: true });
        break;
      case 'ArrowDown':
        event.preventDefault();
        setActive(activeIndex() + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive(activeIndex() <= 0 ? itemsOf(menu).length - 1 : activeIndex() - 1);
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(itemsOf(menu).length - 1);
        break;
      case 'Tab':
        // Tabbing out is a dismissal, not a trap.
        closeMenu();
        break;
      default:
        break;
    }
  };

  // focusout covers the case where focus leaves the account area by any
  // means, including a click on a non-focusable element in some browsers.
  const onFocusOut = (event) => {
    if (!open) return;
    const next = event.relatedTarget;
    if (next && (trigger.contains(next) || menu.contains(next))) return;
    closeMenu();
  };

  const onMenuClick = (event) => {
    const item = event.target.closest('[data-menu-item]');
    if (!item) return;

    closeMenu();

    if (item.dataset.menuItem === 'logout') {
      onLogout?.();
      return;
    }

    onNavigate?.(item);
  };

  trigger.addEventListener('click', onTriggerClick);
  trigger.addEventListener('keydown', onKeydown);
  menu.addEventListener('keydown', onKeydown);
  menu.addEventListener('click', onMenuClick);
  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('focusout', onFocusOut, true);

  return () => {
    trigger.removeEventListener('click', onTriggerClick);
    trigger.removeEventListener('keydown', onKeydown);
    menu.removeEventListener('keydown', onKeydown);
    menu.removeEventListener('click', onMenuClick);
    document.removeEventListener('click', onDocumentClick, true);
    document.removeEventListener('focusout', onFocusOut, true);
  };
}