import express from 'express';
import * as controller from '../controllers/category.controller.js';
<<<<<<< HEAD
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

=======

const router = express.Router();

router.get('/', controller.getAllCategories);

>>>>>>> 19f8c752c7439a1e2d1256921bd63921916910f5
export default router;
