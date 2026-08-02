import express from 'express';
import request from 'supertest';

// ─── 1. MODULE MOCKS ─────────────────────────────────────────────────────────

// ── 1a. Product model ────────────────────────────────────────────────────────
jest.mock('../../api/models/product.model.js', () => {
  const mockProductInstance = {
    _id: '507f1f77bcf86cd799439022',
    title: 'Test Product',
    price: 99.99,
    category: 'electronics',
    seller: { name: 'Seller Name', email: 'seller@example.com' },
    createdAt: new Date().toISOString(),
  };

  return {
    __esModule: true,
    default: {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      _mockInstance: mockProductInstance,
    },
  };
});

// ── 1b. User model ───────────────────────────────────────────────────────────
jest.mock('../../api/models/user.model.js', () => {
  const mockToPublic = jest.fn().mockReturnValue({
    id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    isBlocked: false,
    isDeleted: false,
  });

  const mockUserInstance = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    isBlocked: false,
    isDeleted: false,
    isEmailVerified: false,
    deletedAt: null,
    toPublic: mockToPublic,
    save: jest.fn().mockResolvedValue(true),
  };

  return {
    __esModule: true,
    default: {
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      _mockInstance: mockUserInstance,
      _mockToPublic: mockToPublic,
    },
  };
});

// ── 1c. Auth middleware ──────────────────────────────────────────────────────
jest.mock('../../api/middlewares/auth.middleware.js', () => {
  const _state = { simulateFail: false };

  const protect = (req, res, next) => {
    if (_state.simulateFail) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    req.user = {
      id: 'admin-123',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    };
    next();
  };

  protect._state = _state;

  return { __esModule: true, default: protect };
});

// ── 1d. Role middleware ──────────────────────────────────────────────────────
jest.mock('../../api/middlewares/role.middlewares.js', () => {
  const authorizeRoles = (...allowedRoles) => (req, res, next) => next();
  return { __esModule: true, default: authorizeRoles };
});

// ── 1e. Utils ────────────────────────────────────────────────────────────────
jest.mock('../../api/library/utils.js', () => ({
  sendResponse: jest.fn((res, status, success, message, data) =>
    res.status(status).json({ success, message, ...data }),
  ),
}));

// ─── 2. IMPORTS ──────────────────────────────────────────────────────────────

import adminRoutes from '../../api/routes/admin.route.js';
import Product from '../../api/models/product.model.js';
import User from '../../api/models/user.model.js';
import protect from '../../api/middlewares/auth.middleware.js';

// ─── 3. MINIMAL TEST APP ─────────────────────────────────────────────────────

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  return app;
};

const app = buildApp();

// ─── 4. RESET HELPER ─────────────────────────────────────────────────────────

const resetMocks = () => {
  protect._state.simulateFail = false;

  const userInstance = User._mockInstance;
  userInstance._id = '507f1f77bcf86cd799439011';
  userInstance.name = 'Test User';
  userInstance.email = 'test@example.com';
  userInstance.role = 'user';
  userInstance.isBlocked = false;
  userInstance.isDeleted = false;
  userInstance.isEmailVerified = false;
  userInstance.deletedAt = null;

  const prodInstance = Product._mockInstance;
  prodInstance._id = '507f1f77bcf86cd799439022';
  prodInstance.title = 'Test Product';
  prodInstance.price = 99.99;

  jest.clearAllMocks();

  User._mockToPublic.mockReturnValue({
    id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    isBlocked: false,
    isDeleted: false,
  });
  userInstance.toPublic = User._mockToPublic;
  userInstance.save = jest.fn().mockResolvedValue(true);

  User.findById.mockResolvedValue(userInstance);
  User.find.mockReturnValue({
    sort: jest.fn().mockResolvedValue([userInstance]),
  });
  User.countDocuments.mockResolvedValue(0);

  Product.findById.mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(prodInstance),
  });
  Product.find.mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([prodInstance]),
  });
  Product.findByIdAndDelete.mockResolvedValue(prodInstance);
  Product.countDocuments.mockResolvedValue(0);
};

// ─── 5. TEST SUITES ──────────────────────────────────────────────────────────

describe('Admin Controller', () => {
  beforeEach(resetMocks);

  // ── 5.1  Auth failures ────────────────────────────────────────────────────

  describe('Auth failures', () => {
    test('GET /dashboard/stats → 401 when protect middleware rejects', async () => {
      protect._state.simulateFail = true;

      const res = await request(app).get('/api/admin/dashboard/stats');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test('PATCH /users/:id/block → 401 when protect middleware rejects', async () => {
      protect._state.simulateFail = true;

      const res = await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/block');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  // ── 5.2  getDashboardStats ────────────────────────────────────────────────

  describe('getDashboardStats', () => {
    test('200 – returns dashboard stats successfully', async () => {
      User.countDocuments
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(3);
      Product.countDocuments.mockResolvedValue(20);

      const res = await request(app).get('/api/admin/dashboard/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Dashboard stats retrieved successfully');
      expect(res.body.users).toEqual({ total: 10, blocked: 1 });
      expect(res.body.sellers).toEqual({
        total: 5,
        blocked: 0,
        verified: 3,
      });
      expect(res.body.products).toEqual({ total: 20 });
      expect(User.countDocuments).toHaveBeenCalledTimes(5);
      expect(Product.countDocuments).toHaveBeenCalledTimes(1);
    });

    test('500 – on unexpected DB error', async () => {
      User.countDocuments.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/admin/dashboard/stats');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Dashboard stats retrieval unsuccessful');
    });
  });

  // ── 5.3  getAllUsers ──────────────────────────────────────────────────────

  describe('getAllUsers', () => {
    test('200 – returns all active users with public profiles', async () => {
      const user2 = {
        ...User._mockInstance,
        _id: '507f1f77bcf86cd799439033',
        toPublic: User._mockToPublic,
      };
      User.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([User._mockInstance, user2]),
      });

      const res = await request(app).get('/api/admin/users');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Users retrieved successfully');
      expect(res.body.users).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(User._mockToPublic).toHaveBeenCalledTimes(2);
    });

    test('200 – queries users with isDeleted false filter', async () => {
      await request(app).get('/api/admin/users');

      expect(User.find).toHaveBeenCalledWith({ isDeleted: false });
    });

    test('200 – returns empty array when no users exist', async () => {
      User.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const res = await request(app).get('/api/admin/users');

      expect(res.status).toBe(200);
      expect(res.body.users).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    test('500 – on unexpected DB error', async () => {
      User.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const res = await request(app).get('/api/admin/users');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ── 5.4  getSingleUser ────────────────────────────────────────────────────

  describe('getSingleUser', () => {
    test('200 – returns single user profile', async () => {
      User.findById.mockResolvedValue(User._mockInstance);

      const res = await request(app).get(
        '/api/admin/users/507f1f77bcf86cd799439011'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User retrieved successfully');
      expect(res.body.user).toMatchObject({
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });
    });

    test('200 – queries DB with id from req.params', async () => {
      await request(app).get('/api/admin/users/507f1f77bcf86cd799439011');

      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(User.findById).toHaveBeenCalledTimes(1);
    });

    test('400 – invalid user ID format', async () => {
      const res = await request(app).get('/api/admin/users/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid user ID');
    });

    test('404 – user not found', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).get(
        '/api/admin/users/507f1f77bcf86cd799439011'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    test('500 – on unexpected DB error', async () => {
      User.findById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get(
        '/api/admin/users/507f1f77bcf86cd799439011'
      );

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ── 5.5  blockUser ────────────────────────────────────────────────────────

  describe('blockUser', () => {
    test('200 – blocks user successfully', async () => {
      const instance = User._mockInstance;
      instance.isBlocked = false;
      User.findById.mockResolvedValue(instance);

      User._mockToPublic.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isBlocked: true,
      });
      instance.toPublic = User._mockToPublic;

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/block'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User blocked successfully');
      expect(instance.isBlocked).toBe(true);
      expect(instance.save).toHaveBeenCalled();
      expect(res.body.user.isBlocked).toBe(true);
    });

    test('200 – queries DB with id from req.params', async () => {
      const instance = User._mockInstance;
      instance.isBlocked = false;
      User.findById.mockResolvedValue(instance);

      await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/block'
      );

      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    test('400 – invalid user ID', async () => {
      const res = await request(app).patch(
        '/api/admin/users/invalid-id/block'
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid user ID');
    });

    test('404 – user not found', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/block'
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    test('409 – user is already blocked', async () => {
      const instance = User._mockInstance;
      instance.isBlocked = true;
      User.findById.mockResolvedValue(instance);

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/block'
      );

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('User is already blocked');
    });

    test('500 – on unexpected DB error', async () => {
      User.findById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/block'
      );

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ── 5.6  unblockUser ──────────────────────────────────────────────────────

  describe('unblockUser', () => {
    test('200 – unblocks user successfully', async () => {
      const instance = User._mockInstance;
      instance.isBlocked = true;
      User.findById.mockResolvedValue(instance);

      User._mockToPublic.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isBlocked: false,
      });
      instance.toPublic = User._mockToPublic;

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/unblock'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User unblocked successfully');
      expect(instance.isBlocked).toBe(false);
      expect(instance.save).toHaveBeenCalled();
      expect(res.body.user.isBlocked).toBe(false);
    });

    test('400 – invalid user ID', async () => {
      const res = await request(app).patch(
        '/api/admin/users/invalid-id/unblock'
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid user ID');
    });

    test('404 – user not found', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/unblock'
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    test('409 – user is not blocked', async () => {
      const instance = User._mockInstance;
      instance.isBlocked = false;
      User.findById.mockResolvedValue(instance);

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/unblock'
      );

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('User is not blocked');
    });

    test('500 – on unexpected DB error', async () => {
      User.findById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/unblock'
      );

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ── 5.7  deleteUser ───────────────────────────────────────────────────────

  describe('deleteUser', () => {
    test('200 – soft deletes user successfully', async () => {
      const instance = User._mockInstance;
      instance.isDeleted = false;
      instance.deletedAt = null;
      User.findById.mockResolvedValue(instance);

      User._mockToPublic.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isDeleted: true,
      });
      instance.toPublic = User._mockToPublic;

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/delete'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User deleted successfully');
      expect(instance.isDeleted).toBe(true);
      expect(instance.deletedAt).toBeInstanceOf(Date);
      expect(instance.save).toHaveBeenCalled();
      expect(res.body.user.isDeleted).toBe(true);
    });

    test('400 – invalid user ID', async () => {
      const res = await request(app).patch(
        '/api/admin/users/invalid-id/delete'
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid user ID');
    });

    test('404 – user not found', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/delete'
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    test('409 – user has already been deleted', async () => {
      const instance = User._mockInstance;
      instance.isDeleted = true;
      User.findById.mockResolvedValue(instance);

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/delete'
      );

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('User has already been deleted');
    });

    test('500 – on unexpected DB error', async () => {
      User.findById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/delete'
      );

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ── 5.8  restoreUser ──────────────────────────────────────────────────────

  describe('restoreUser', () => {
    test('200 – restores deleted user successfully', async () => {
      const instance = User._mockInstance;
      instance.isDeleted = true;
      instance.deletedAt = new Date();
      User.findById.mockResolvedValue(instance);

      User._mockToPublic.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isDeleted: false,
      });
      instance.toPublic = User._mockToPublic;

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/restore'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User restored successfully');
      expect(instance.isDeleted).toBe(false);
      expect(instance.deletedAt).toBeNull();
      expect(instance.save).toHaveBeenCalled();
      expect(res.body.user.isDeleted).toBe(false);
    });

    test('400 – invalid user ID', async () => {
      const res = await request(app).patch(
        '/api/admin/users/invalid-id/restore'
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid user ID');
    });

    test('404 – user not found', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/restore'
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    test('409 – user is already active', async () => {
      const instance = User._mockInstance;
      instance.isDeleted = false;
      User.findById.mockResolvedValue(instance);

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/restore'
      );

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('User is already active');
    });

    test('500 – on unexpected DB error', async () => {
      User.findById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).patch(
        '/api/admin/users/507f1f77bcf86cd799439011/restore'
      );

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ── 5.9  getAllProducts ───────────────────────────────────────────────────

  describe('getAllProducts', () => {
    test('200 – returns all products', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([Product._mockInstance]),
      });

      const res = await request(app).get('/api/admin/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Products retrieved successfully');
      expect(res.body.products).toHaveLength(1);
    });

    test('404 – no products found', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });

      const res = await request(app).get('/api/admin/products');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No products found');
    });

    test('500 – on unexpected DB error', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const res = await request(app).get('/api/admin/products');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ── 5.10  getSingleProduct ────────────────────────────────────────────────

  describe('getSingleProduct', () => {
    test('200 – returns single product', async () => {
      Product.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(Product._mockInstance),
      });

      const res = await request(app).get(
        '/api/admin/products/507f1f77bcf86cd799439022'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product retrieved successfully');
      expect(res.body.product).toMatchObject({
        _id: '507f1f77bcf86cd799439022',
        title: 'Test Product',
      });
    });

    test('200 – queries DB with id from req.params', async () => {
      await request(app).get('/api/admin/products/507f1f77bcf86cd799439022');

      expect(Product.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022'
      );
      expect(Product.findById).toHaveBeenCalledTimes(1);
    });

    test('400 – invalid product ID', async () => {
      const res = await request(app).get('/api/admin/products/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid product ID');
    });

    test('404 – product not found', async () => {
      Product.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app).get(
        '/api/admin/products/507f1f77bcf86cd799439022'
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Product not found');
    });

    test('500 – on unexpected DB error', async () => {
      Product.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const res = await request(app).get(
        '/api/admin/products/507f1f77bcf86cd799439022'
      );

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ── 5.11  deleteProduct ───────────────────────────────────────────────────

  describe('deleteProduct', () => {
    test('200 – deletes product successfully', async () => {
      Product.findByIdAndDelete.mockResolvedValue(Product._mockInstance);

      const res = await request(app).delete(
        '/api/admin/products/507f1f77bcf86cd799439022'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product deleted successfully');
    });

    test('200 – calls findByIdAndDelete with correct id', async () => {
      await request(app).delete(
        '/api/admin/products/507f1f77bcf86cd799439022'
      );

      expect(Product.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022'
      );
    });

    test('404 – product not found', async () => {
      Product.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app).delete(
        '/api/admin/products/507f1f77bcf86cd799439022'
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Product not found');
    });

    test('500 – on unexpected DB error', async () => {
      Product.findByIdAndDelete.mockRejectedValue(new Error('DB error'));

      const res = await request(app).delete(
        '/api/admin/products/507f1f77bcf86cd799439022'
      );

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });
});