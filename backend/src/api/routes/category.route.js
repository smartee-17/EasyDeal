import express from 'express';
import * as controller from '../controllers/category.controller.js';
import authorizeRoles from '../middlewares/role.middlewares.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('admin'), controller.createCategory);

router.get('/', controller.getAllCategories);

router.get('/:id', controller.getCategoryById);

router.put('/:id', protect, authorizeRoles('admin'), controller.updateCategory);

router.delete(
  '/:id',
  protect,
  authorizeRoles('admin'),
  controller.deleteCategory,
);

export default router;
