import express from 'express';

import productRoutes from './product.route.js';
import authRoutes from './auth.route.js';
import profileRoutes from './user.route.js'

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/products', productRoutes);

router.use('/profile', profileRoutes);

export default router;
