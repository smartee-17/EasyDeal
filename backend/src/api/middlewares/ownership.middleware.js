import { sendResponse } from '../library/utils.js';
import Product from '../models/product.model.js';

export const isProductOwnerOrAdmin = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendResponse(res, 400, false, 'Product not found');
    }

    const isOwner = product.seller.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendResponse(
        res,
        403,
        false,
        'Not authorized to modify this product',
      );
    }

    req.product = product;
    next();
  } catch (err) {
    next(err);
  }
};
