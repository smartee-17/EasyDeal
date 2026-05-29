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

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    if (categories.length === 0) {
      return res.status(404).json({ message: 'No categories found' });
    }

    return sendResponse(
      res,
      200,
      true,
      'Categories retrieved successfully',
      categories,
    );
  } catch (error) {
    console.log(`Error getting categories: ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return sendResponse(
      res,
      200,
      true,
      'Category retrieved successfully',
      category,
    );
  } catch (error) {
    console.log(`Error getting category by id: ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { returnDocument: 'after' },
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return sendResponse(
      res,
      200,
      true,
      'Category updated successfully',
      category,
    );
  } catch (error) {
    console.log(`Error updating category: ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return sendResponse(
      res,
      200,
      true,
      'Category deleted successfully',
      category,
    );
  } catch (error) {
    console.log(`Error deleting category: ${error}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
