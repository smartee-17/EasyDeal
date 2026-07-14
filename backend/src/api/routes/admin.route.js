import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/role.middlewares.js';
import * as controller from '../controllers/admin.controller.js';

const router = express.Router();

router.get(
  '/products',
  protect,
  authorizeRoles('admin'),
  controller.getAllProducts,
);

router.delete(
  '/products/:id',
  protect,
  authorizeRoles('admin'),
  controller.deleteProduct,
);

export default router;
