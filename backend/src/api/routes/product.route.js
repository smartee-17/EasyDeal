import express from 'express';
import * as controller from '../controllers/product.controller.js';
import protect from '../middlewares/auth.middleware.js';
import cloudinary, { upload } from '../../config/cloudinary.js';

const router = express.Router();

router.get('/', controller.getAllProducts);

router.get('/:id', controller.getProductById);

router.post('/', protect, upload.array('images', 5), controller.createProduct);

router.put(
  '/:id',
  protect,
  upload.array('images', 5),
  controller.updateProduct,
);

router.delete('/:id', protect, controller.deleteProduct);

export default router;
