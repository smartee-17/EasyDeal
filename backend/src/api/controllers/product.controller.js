import { sendResponse } from '../library/utils.js';
import Product from '../models/product.model.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'name');

    return sendResponse(
      res,
      200,
      true,
      'Products retrieved successfully',
      products,
    );
  } catch (error) {
    console.error(`Error in getAllProducts: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
