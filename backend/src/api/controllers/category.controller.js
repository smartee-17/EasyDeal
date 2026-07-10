import { CATEGORIES } from '../library/constants/category.constants.js';
import { CATEGORY_ATTRIBUTES } from '../library/constants/categoryAttributes.constants.js';

export const getAllCategories = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: CATEGORIES,
  });
};

export const getCategoryAttributes = (req, res) => {
  const { category } = req.params;

  const isValidCategory = CATEGORIES.some((c) => c.key === category);
  if (!isValidCategory) {
    return res.status(404).json({
      success: false,
      message: `Unknown category: ${category}`,
    });
  }

  return res.status(200).json({
    success: true,
    data: CATEGORY_ATTRIBUTES[category] || [],
  });
};
