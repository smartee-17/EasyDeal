import { sendResponse } from '../library/utils.js';
import Category from '../models/category.model.js';

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const category = new Category({ name });

    await category.save();

    return sendResponse(
      res,
      201,
      true,
      'Category created successfully',
      category,
    );
  } catch (error) {
    console.log(`Error creating category: ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
