import { CATEGORY_ENUM } from '../library/constants/category.constants.js';

export const getAllCategories = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: CATEGORY_ENUM,
  });
};
