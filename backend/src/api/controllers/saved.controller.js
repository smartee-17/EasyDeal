import { sendResponse } from '../library/utils.js';
import Saved from '../models/saved.model.js';
import mongoose from 'mongoose';

/**
 * Returns the logged-in user's saved products.
 * Always 200 — an empty list is a normal result, not an error.
 */
export const getSavedProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const savedProducts = await Saved.find({ userId }).populate('productId');

    return sendResponse(
      res,
      200,
      true,
      savedProducts.length > 0
        ? 'Saved products retrieved'
        : 'No saved products found',
      savedProducts,
    );
  } catch (error) {
    console.error(`Error in getSavedProducts: ${error.message}`);
    return sendResponse(res, 500, false, 'Server error');
  }
};

/**
 * Adds a product to the user's saved list.
 * Idempotent — calling this on an already-saved product is not an error,
 * it just confirms the saved state (200) instead of creating a duplicate (201).
 */
export const addProductToSaved = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const existingSavedProduct = await Saved.findOne({ productId, userId });
    if (existingSavedProduct) {
      return sendResponse(
        res,
        200,
        true,
        'Product already saved',
        existingSavedProduct,
      );
    }

    const savedProduct = await Saved.create({ productId, userId });
    return sendResponse(res, 201, true, 'Product added to saved', savedProduct);
  } catch (error) {
    console.error(`Error adding product to saved: ${error.message}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Removes a product from the user's saved list.
 * Idempotent — removing something that was never saved (or already removed)
 * is not an error; it just confirms the unsaved state (200).
 */
export const removeProductFromSaved = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const savedProduct = await Saved.findOneAndDelete({ productId, userId });

    return sendResponse(
      res,
      200,
      true,
      savedProduct ? 'Product removed from saved' : 'Product was not saved',
      savedProduct || null,
    );
  } catch (error) {
    console.error(`Error in removeProductFromSaved: ${error.message}`);
    return sendResponse(res, 500, false, 'Server error');
  }
};

/**
 * Checks whether a single product is saved by the logged-in user.
 * Always 200 — "not saved" is a normal answer, carried in the payload
 * as { saved: false } rather than as a 404.
 */
export const checkProductInSaved = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const savedProduct = await Saved.findOne({ productId, userId });

    return sendResponse(
      res,
      200,
      true,
      savedProduct ? 'Product found in saved' : 'Product not saved',
      { saved: !!savedProduct },
    );
  } catch (error) {
    console.error(`Error in checkProductInSaved: ${error.message}`);
    return sendResponse(res, 500, false, 'Server error');
  }
};
