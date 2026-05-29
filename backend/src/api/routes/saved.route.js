import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import * as controller from '../controllers/saved.controller.js';

const router = express.Router();

router.post('/', protect, controller.addProductToSaved);

export default router;
