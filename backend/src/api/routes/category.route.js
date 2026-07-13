import express from 'express';
import * as controller from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', controller.getAllCategories);

export default router;
