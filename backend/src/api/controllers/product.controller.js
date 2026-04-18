import { sendResponse } from '../library/utils.js';
import Product from '../models/product.model.js';

export const getAllProducts = async (req, res) => {
  try {
    // TODO: We use populate after user model is defined
    // const products = await Product.find().populate('seller', 'name');
    const products = await Product.find();

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

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: We use populate after user model is defined
    // const product = await Product.findById(id).populate('seller', 'name');
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return sendResponse(
      res,
      200,
      true,
      'Product retrieved successfully',
      product,
    );
  } catch (error) {
    console.error(`Error in getProduct: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { _id } = req.user;
    // TODO: Images should be uploaded to cloudinary before saving
    const { title, description, category, images, price } = req.body;

    const product = new Product({
      title,
      description,
      category,
      images,
      price,
      seller: _id,
    });
    await product.save();

    return sendResponse(
      res,
      201,
      true,
      'Product created successfully',
      product,
    );
  } catch (error) {
    console.error(`Error in createProduct: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { _id } = req.user;
    const { id } = req.params;
    const { title, description, category, images, price } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        title,
        description,
        category,
        images,
        price,
      },
      { returnDocument: 'after' },
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return sendResponse(
      res,
      200,
      true,
      'Product updated successfully',
      product,
    );
  } catch (error) {
    console.error(`Error in updateProduct: ${error.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
