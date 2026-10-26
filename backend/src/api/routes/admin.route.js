import express from 'express';

import protect from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/role.middlewares.js';
import * as controller from '../controllers/admin.controller.js';

const router = express.Router();

// ==========================================
// Dashboard
// ==========================================

router.get(
  '/dashboard/stats',
  protect,
  authorizeRoles('admin'),
  controller.getDashboardStats
);


// ==========================================
// Product Management
// ==========================================

// Get all products
router.get(
  '/products',
  protect,
  authorizeRoles('admin'),
  controller.getAllProducts
);

// Search products
router.get(
  '/products/search',
  protect,
  authorizeRoles('admin'),
  controller.getProductsBySearch
);

// Get single product
router.get(
  '/products/:id',
  protect,
  authorizeRoles('admin'),
  controller.getSingleProduct
);

// Delete product
router.delete(
  '/products/:id',
  protect,
  authorizeRoles('admin'),
  controller.deleteProduct
);


// ==========================================
// User Management
// ==========================================

// Get all users
router.get(
  '/users',
  protect,
  authorizeRoles('admin'),
  controller.getAllUsers
);

// Search users
router.get(
  '/users/search',
  protect,
  authorizeRoles('admin'),
  controller.getUsersBySearch
);

// Get single user
router.get(
  '/users/:id',
  protect,
  authorizeRoles('admin'),
  controller.getSingleUser
);

// Block user
router.patch(
  '/users/:id/block',
  protect,
  authorizeRoles('admin'),
  controller.blockUser
);

// Unblock user
router.patch(
  '/users/:id/unblock',
  protect,
  authorizeRoles('admin'),
  controller.unblockUser
);

// Soft delete user
router.patch(
  '/users/:id/delete',
  protect,
  authorizeRoles('admin'),
  controller.deleteUser
);

// Restore user
router.patch(
  '/users/:id/restore',
  protect,
  authorizeRoles('admin'),
  controller.restoreUser
);

export default router;
