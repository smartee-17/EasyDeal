import express from 'express';

import protect from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/role.middlewares.js';

import * as controller from '../controllers/admin.controller.js';

const router = express.Router();

// Dashboard
router.get(
  '/dashboard/stats',
  protect,
  authorizeRoles('admin'),
  controller.getDashboardStats
);


// Product management
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

router.get(
  '/products/:id',
  protect,
  authorizeRoles('admin'),
  controller.getSingleProduct
);


// User management 
router.get(
  '/users', 
  protect,
  authorizeRoles('admin'),
  controller.getAllUsers
);

router.get(
  '/users/:id',
  protect,
  authorizeRoles('admin'),
  controller.getSingleUser
);

router.patch(
  '/users/:id/block',
  protect,
  authorizeRoles('admin'),
  controller.blockUser
);

router.patch(
  '/users/:id/unblock',
  protect,
  authorizeRoles('admin'),
  controller.unblockUser
);

router.patch(
  '/users/:id/delete',
  protect,
  authorizeRoles('admin'),
  controller.deleteUser
);

router.patch(
  '/users/:id/restore',
  protect,
  authorizeRoles('admin'),
  controller.restoreUser
);


export default router;
