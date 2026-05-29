import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/saved.controller.js';

const router = express.Router();

router.get('/', protect, controller.getSavedProducts);

router.post('/:productId', protect, controller.addProductToSaved);

router.delete('/:productId', protect, controller.removeProductFromSaved);

export default router;
