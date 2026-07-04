import express from 'express';

import productRoutes from './product.route.js';
import authRoutes from './auth.route.js';
import categoryRoutes from './category.route.js';
import savedRoutes from './saved.route.js';
import tagRoutes from './tag.route.js';
import adminRoutes from './admin.route.js';

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/products', productRoutes);

router.use('/categories', categoryRoutes);

router.use('/tags', tagRoutes);

router.use('/saved', savedRoutes);

router.use('/admin', adminRoutes);

export default router;
