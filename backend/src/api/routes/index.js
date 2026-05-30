import express from 'express';

import productRoutes from './product.route.js';
<<<<<<< HEAD

const router = express.Router();

=======
import authRoutes from './auth.route.js';

const router = express.Router();

router.use('/auth', authRoutes);

>>>>>>> 7d5f02507bc9b7e15747812fe41e9b69e1f3081b
router.use('/products', productRoutes);

export default router;
