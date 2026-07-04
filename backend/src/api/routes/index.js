import express from 'express';

import productRoutes from './product.route.js';
import authRoutes from './auth.route.js';
import categoryRoutes from './category.route.js';
<<<<<<< HEAD
=======
import savedRoutes from './saved.route.js';
import tagRoutes from './tag.route.js';
>>>>>>> 19f8c752c7439a1e2d1256921bd63921916910f5

const router = express.Router();

router.use('/auth', authRoutes);

router.use('/products', productRoutes);

router.use('/categories', categoryRoutes);

<<<<<<< HEAD
=======
router.use('/tags', tagRoutes);

router.use('/saved', savedRoutes);

>>>>>>> 19f8c752c7439a1e2d1256921bd63921916910f5
export default router;
