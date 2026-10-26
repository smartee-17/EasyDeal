import { CATEGORIES } from '../library/constants/category.constants.js';
import { CATEGORY_ATTRIBUTES } from '../library/constants/categoryAttributes.constants.js';
import { sendResponse } from '../library/utils.js';

export const getAllCategories = (req, res) => {
  return sendResponse(
    res,
    200,
    true,
    'Categories retrieved successfully',
    CATEGORIES,
  );
};

export const getCategoryAttributes = (req, res) => {
  const { category } = req.params;

  const isValidCategory = CATEGORIES.some((c) => c.key === category);
  if (!isValidCategory) {
    return sendResponse(res, 404, false, `Unknown category: ${category}`);
    // return res.status(404).json({
    //   success: false,
    //   message: `Unknown category: ${category}`,
    // });
  }

  return sendResponse(
    res,
    200,
    true,
    'Categories attributes retrieved successfully',
    CATEGORY_ATTRIBUTES[category] || [],
  );
  // return res.status(200).json({
  //   success: true,
  //   data: CATEGORY_ATTRIBUTES[category] || [],
  // });
};
