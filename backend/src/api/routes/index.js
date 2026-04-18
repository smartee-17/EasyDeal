import express from 'express';

import productRoutes from './product.route.js';

const router = express.Router();

router.use('/products', productRoutes);

export default router;
