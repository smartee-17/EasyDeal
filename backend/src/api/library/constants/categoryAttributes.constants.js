/**
 * CATEGORY_ATTRIBUTES
 *
 * Defines the specification template for each product category.
 * Each attribute has:
 *   - key:      unique identifier stored in Product.specifications
 *   - label:    human-readable name shown on the Add Product form
 *   - type:     "select" | "text" | "number" | "boolean"
 *   - options:  required when type is "select"
 *   - required: whether the seller must fill this in to publish the product
 *
 * Keys here are examples based on common e-commerce categories.
 * Rename these to match your actual CATEGORY_ENUM values.
 */
export const CATEGORY_ATTRIBUTES = {
  electronics: [
    { key: 'brand', label: 'Brand', type: 'text', required: true },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        'Phone',
        'Tablet',
        'Laptop',
        'TV',
        'Camera',
        'Audio',
        'Accessory',
        'Other',
      ],
      required: true,
    },
    {
      key: 'ram',
      label: 'RAM',
      type: 'select',
      options: ['2GB', '4GB', '6GB', '8GB', '16GB', '32GB', '64GB', 'N/A'],
      required: false,
    },
    {
      key: 'storage',
      label: 'Storage',
      type: 'select',
      options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB', 'N/A'],
      required: false,
    },
    { key: 'color', label: 'Color', type: 'text', required: false },
    {
      key: 'warranty',
      label: 'Warranty',
      type: 'select',
      options: ['No warranty', 'Under 6 months', '6-12 months', '1 year+'],
      required: false,
    },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'],
      required: true,
    },
  ],

  clothing: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
      required: true,
    },
    { key: 'color', label: 'Color', type: 'text', required: true },
    { key: 'material', label: 'Material', type: 'text', required: false },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'],
      required: true,
    },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New with tags', 'New without tags', 'Used'],
      required: true,
    },
  ],

  shoes: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        '36',
        '37',
        '38',
        '39',
        '40',
        '41',
        '42',
        '43',
        '44',
        '45',
        '46',
      ],
      required: true,
    },
    { key: 'color', label: 'Color', type: 'text', required: true },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'],
      required: true,
    },
    { key: 'material', label: 'Material', type: 'text', required: false },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Good', 'Used - Fair'],
      required: true,
    },
  ],

  watches_jewelry: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    {
      key: 'material',
      label: 'Material',
      type: 'select',
      options: [
        'Gold',
        'Silver',
        'Stainless steel',
        'Leather',
        'Plastic',
        'Other',
      ],
      required: true,
    },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['Men', 'Women', 'Unisex'],
      required: false,
    },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Like new', 'Used - Good'],
      required: true,
    },
  ],

  home_kitchen: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'material', label: 'Material', type: 'text', required: false },
    { key: 'dimensions', label: 'Dimensions', type: 'text', required: false },
    {
      key: 'power_rating',
      label: 'Power rating',
      type: 'text',
      required: false,
    },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'],
      required: true,
    },
  ],

  furniture: [
    {
      key: 'material',
      label: 'Material',
      type: 'select',
      options: [
        'Wood',
        'Metal',
        'Glass',
        'Plastic',
        'Fabric',
        'Leather',
        'Mixed',
      ],
      required: true,
    },
    {
      key: 'dimensions',
      label: 'Dimensions (LxWxH)',
      type: 'text',
      required: false,
    },
    { key: 'color', label: 'Color', type: 'text', required: false },
    {
      key: 'assembly_required',
      label: 'Assembly required',
      type: 'boolean',
      required: false,
    },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'],
      required: true,
    },
  ],

  beauty_personal_care: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    {
      key: 'volume_weight',
      label: 'Volume / weight',
      type: 'text',
      required: false,
    },
    {
      key: 'skin_hair_type',
      label: 'Skin / hair type',
      type: 'select',
      options: ['All types', 'Oily', 'Dry', 'Combination', 'Sensitive'],
      required: false,
    },
    { key: 'expiry_date', label: 'Expiry date', type: 'text', required: false },
  ],

  groceries: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    {
      key: 'weight_volume',
      label: 'Weight / volume',
      type: 'text',
      required: true,
    },
    { key: 'expiry_date', label: 'Expiry date', type: 'text', required: false },
    {
      key: 'dietary_info',
      label: 'Dietary info',
      type: 'select',
      options: [
        'None',
        'Vegetarian',
        'Vegan',
        'Gluten-free',
        'Halal',
        'Kosher',
      ],
      required: false,
    },
  ],

  books: [
    { key: 'author', label: 'Author', type: 'text', required: true },
    { key: 'genre', label: 'Genre', type: 'text', required: false },
    { key: 'language', label: 'Language', type: 'text', required: false },
    {
      key: 'format',
      label: 'Format',
      type: 'select',
      options: ['Hardcover', 'Paperback', 'E-book'],
      required: true,
    },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'],
      required: true,
    },
  ],

  toys_games: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'age_range', label: 'Age range', type: 'text', required: true },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Like new', 'Used - Good'],
      required: true,
    },
  ],

  sports_outdoors: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'size', label: 'Size', type: 'text', required: false },
    { key: 'material', label: 'Material', type: 'text', required: false },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Like new', 'Used - Good', 'Used - Fair'],
      required: true,
    },
  ],

  automotive: [
    { key: 'brand', label: 'Brand / make', type: 'text', required: true },
    { key: 'model', label: 'Model', type: 'text', required: false },
    { key: 'part_type', label: 'Part type', type: 'text', required: false },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Good', 'Used - Fair', 'For parts'],
      required: true,
    },
  ],

  baby_products: [
    { key: 'brand', label: 'Brand', type: 'text', required: false },
    { key: 'age_range', label: 'Age range', type: 'text', required: true },
    { key: 'material', label: 'Material', type: 'text', required: false },
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['New', 'Used - Like new', 'Used - Good'],
      required: true,
    },
  ],
};
