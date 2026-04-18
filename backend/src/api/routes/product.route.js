import express from 'express';
import * as controller from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', controller.getAllProducts);

router.get('/:id', controller.getProductById);

export default router;
