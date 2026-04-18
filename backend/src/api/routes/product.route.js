import express from 'express';
import * as controller from '../controllers/product.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', controller.getAllProducts);

router.get('/:id', controller.getProductById);

router.post('/', protect, controller.createProduct);

router.put('/:id', protect, controller.updateProduct);

export default router;
