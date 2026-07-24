/**
 * CATEGORIES
 *
 * Structured category definitions, mirroring the shape used in
 * CATEGORY_ATTRIBUTES (key + label) instead of a flat list of strings.
 * This is the single source of truth for category keys — the keys here
 * must match the keys used in CATEGORY_ATTRIBUTES exactly.
 */
export const CATEGORIES = [
  { key: 'electronics', label: 'Electronics' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'books', label: 'Books' },
  { key: 'sports', label: 'Sports' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'food', label: 'Food' },
  { key: 'toys', label: 'Toys' },
  { key: 'automotive', label: 'Automotive' },
  { key: 'other', label: 'Other' },
];

/**
 * CATEGORY_ENUM
 *
 * Plain array of category keys, derived from CATEGORIES.
 * Kept for backward compatibility with existing code that expects
 * a flat string array (e.g. Mongoose schema `enum` validation).
 */
export const CATEGORY_ENUM = CATEGORIES.map((category) => category.key);
