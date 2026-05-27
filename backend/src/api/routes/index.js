import express from 'express';

import productRoutes from './product.route.js';
import authRoutes from './auth.route.js';
import categoryRoutes from './category.route.js';

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/products', productRoutes);

router.use('/categories', categoryRoutes);

export default router;
