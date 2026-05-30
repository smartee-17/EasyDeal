import express from 'express';
import * as controller from '../controllers/product.controller.js';
import protect from '../middlewares/auth.middleware.js';
<<<<<<< HEAD
=======
import cloudinary, { upload } from '../../config/cloudinary.js';
>>>>>>> 7d5f02507bc9b7e15747812fe41e9b69e1f3081b

const router = express.Router();

router.get('/', controller.getAllProducts);

router.get('/:id', controller.getProductById);

<<<<<<< HEAD
router.post('/', protect, controller.createProduct);

router.put('/:id', protect, controller.updateProduct);
=======
router.post('/', protect, upload.array('images', 5), controller.createProduct);

router.put(
  '/:id',
  protect,
  upload.array('images', 5),
  controller.updateProduct,
);
>>>>>>> 7d5f02507bc9b7e15747812fe41e9b69e1f3081b

router.delete('/:id', protect, controller.deleteProduct);

export default router;
