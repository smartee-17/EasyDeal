import express from 'express';
import * as controller from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', controller.getAllCategories);

router.get('/:category/attributes', controller.getCategoryAttributes);

export default router;
