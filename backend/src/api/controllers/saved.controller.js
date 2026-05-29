import { sendResponse } from '../library/utils.js';
import Saved from '../models/saved.model.js';

export const getSavedProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const savedProducts = await Saved.find({ userId })
      .populate('productId')
      .populate('userId');

    if (!savedProducts) {
      return res
        .status(404)
        .json({ success: false, message: 'No saved products found' });
    }

    sendResponse(res, 200, true, 'Saved products retrieved', savedProducts);
  } catch (error) {
    sendResponse(res, 500, false, 'Server error');
  }
};

export const addProductToSaved = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: 'Product ID is required' });
    }

    const savedProduct = await Saved.create({ productId, userId });

    sendResponse(res, 200, true, 'Product added to saved', savedProduct);
  } catch (error) {
    sendResponse(res, 500, false, 'Server error');
  }
};
