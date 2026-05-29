import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/saved.controller.js';

const router = express.Router();

router.post('/', protect, controller.addProductToSaved);

router.get('/', protect, controller.getSavedProducts);

export default router;
