import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../api/controllers/product.controller.js';

import Product from '../../api/models/product.model.js';

import cloudinary from '../../config/cloudinary.js';

// --- MOCKS ---

// Mock Models
jest.mock('../../api/models/product.model.js');
jest.mock('../../api/models/tag.model.js');
jest.mock('../../api/models/user.model.js');

// Mock Cache
jest.mock('../../api/cache/cache.wrapper.js', () => ({
  __esModule: true,
  cacheWrapper: jest.fn(async ({ fetchFunction }) => await fetchFunction()),
  cacheDelete: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../api/cache/cache.keys.js', () => ({
  CacheKeys: {
    product: (id) => `product:${id}`,
    products: () => 'products:*',
  },
}));

// Mock Cloudinary
const mockDestroy = jest.fn().mockResolvedValue({ result: 'ok' });
jest.mock('../../config/cloudinary.js', () => ({
  __esModule: true,
  default: {
    uploader: {
      destroy: (...args) => mockDestroy(...args),
    },
  },
  upload: {},
}));

// Mock Vision AI
jest.mock('../../api/library/visionAi.js', () => ({
  generateAltText: jest
    .fn()
    .mockResolvedValue({ detailed: 'AI generated alt text' }),
}));

// --- APP SETUP ---
const app = express();
app.use(express.json());
app.use(cookieParser());

const parseTestToken = (req) => {
  const raw = req.cookies?.token;
  if (!raw) return null;
  const [id, role] = raw.split(':');
  return { id, _id: id, name: 'Test User', role: role || 'seller' };
};

// --- protect (mock) ---
const protect = (req, res, next) => {
  const user = parseTestToken(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
      data: null,
    });
  }
  req.user = user;
  next();
};

// --- optionalAuth (mock) ---
  const user = parseTestToken(req);
  if (user) req.user = user;
  next();
};

// --- authorizeRoles (mock) ---
const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this action',
        data: null,
      });
    }
    next();
  };

// --- isProductOwnerOrAdmin (mock) ---
const isProductOwnerOrAdmin = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      data: null,
    });
  }
  const isOwner = product.seller?.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this product',
      data: null,
    });
  }
  req.product = product;
  next();
};

// No-op upload stand-in (real one is multer)
const noopUpload = (req, res, next) => next();

// Routes — same shape/order as api/routes/product.route.js
app.get('/api/products', optionalAuth, getAllProducts);
app.get('/api/products/:id', getProductById);
app.post('/api/products', protect, noopUpload, createProduct);
app.put(
  '/api/products/:id',
  protect,
  authorizeRoles('admin', 'seller'),
  isProductOwnerOrAdmin,
  noopUpload,
  updateProduct,
);
app.delete('/api/products/:id', protect, deleteProduct);

// --- TEST SUITE ---
describe('Product Controller Integration Tests', () => {
  const mockProductId = '60c72b2f9b1d8b2b8c8b4567';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ==========================================
     GET /api/products
  ========================================== */
  describe('GET /api/products', () => {
    test('should retrieve all products successfully (guest, no filters)', async () => {
      const mockProducts = [{ title: 'Keyboard', price: 100 }];

      Product.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockProducts),
      });

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockProducts);
      expect(Product.find).toHaveBeenCalledWith({});
    });

    test('should filter by owner=me when authenticated', async () => {
      const mockProducts = [
        { title: 'My Keyboard', price: 100, seller: 'user123' },
      ];

      Product.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockProducts),
      });

      const res = await request(app)
        .get('/api/products?owner=me')
        .set('Cookie', 'token=user123:seller');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockProducts);
      expect(Product.find).toHaveBeenCalledWith({ seller: 'user123' });
    });

    test('should return 401 for owner=me when not authenticated', async () => {
      const res = await request(app).get('/api/products?owner=me');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe(
        'Must be logged in to view your own products',
      );
      expect(Product.find).not.toHaveBeenCalled();
    });

    test('should combine category/price/condition/location filters', async () => {
      const mockProducts = [{ title: 'Chair', price: 250 }];

      Product.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockProducts),
      });

      const res = await request(app).get(
        '/api/products?category=furniture,electronics&minPrice=100&maxPrice=500&condition=Brand new&location=Delhi,Noida',
      );

      expect(res.status).toBe(200);
      expect(Product.find).toHaveBeenCalledWith({
        category: { $in: ['furniture', 'electronics'] },
        price: { $gte: 100, $lte: 500 },
        specifications: {
          $elemMatch: { key: 'condition', value: { $in: ['Brand new'] } },
        },
        location: { $in: ['Delhi', 'Noida'] },
      });
    });
  });

  /* ==========================================
     GET /api/products/:id
  ========================================== */
  describe('GET /api/products/:id', () => {
    test('should retrieve product by ID successfully', async () => {
      const mockProduct = { _id: mockProductId, title: 'Keyboard', price: 100 };

      Product.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProduct),
      });

      const res = await request(app).get(`/api/products/${mockProductId}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockProduct);
    });

    test('should return 404 if product not found', async () => {
      Product.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app).get(`/api/products/${mockProductId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Product not found');
    });
  });

  /* ==========================================
     PUT /api/products/:id
  ========================================== */
  describe('PUT /api/products/:id', () => {
    test('should update product fields successfully when caller is the seller', async () => {
      const mockProductInstance = {
        _id: mockProductId,
        title: 'Original Keyboard',
        price: 50,
        seller: 'user123',
        images: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findById = jest.fn().mockResolvedValue(mockProductInstance);

      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .set('Cookie', 'token=user123:seller')
        .send({ price: 99.99, title: 'Updated Keyboard' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Product updated successfully');
      expect(mockProductInstance.save).toHaveBeenCalled();
    });

    test('should update product fields successfully when caller is an admin (ownership bypassed)', async () => {
      const mockProductInstance = {
        _id: mockProductId,
        title: 'Original Keyboard',
        price: 50,
        seller: 'otherUser456',
        images: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findById = jest.fn().mockResolvedValue(mockProductInstance);

      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .set('Cookie', 'token=admin999:admin')
        .send({ title: 'Admin Updated Keyboard' });

      expect(res.status).toBe(200);
      expect(mockProductInstance.save).toHaveBeenCalled();
    });

    test('should return 403 if caller role is neither seller nor admin', async () => {
      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .set('Cookie', 'token=user123:user')
        .send({ title: 'Unauthorized Update' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Not authorized for this action');
      // Ownership middleware/controller should never be reached
      expect(Product.findById).not.toHaveBeenCalled();
    });

    test('should return 403 if caller is a seller but not the product owner', async () => {
      const mockProductInstance = {
        _id: mockProductId,
        seller: 'otherUser456',
        images: [],
      };

      Product.findById = jest.fn().mockResolvedValue(mockProductInstance);

      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .set('Cookie', 'token=user123:seller')
        .send({ title: 'Unauthorized Update' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Not authorized to update this product');
    });

    test('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .send({ title: 'Unauthenticated Update' });

      expect(res.status).toBe(401);
      expect(Product.findById).not.toHaveBeenCalled();
    });

    test('should return 404 if product to update is not found', async () => {
      Product.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .set('Cookie', 'token=user123:seller')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Product not found');
    });
  });

  /* ==========================================
     DELETE /api/products/:id
  ========================================== */
  describe('DELETE /api/products/:id', () => {
    test('should delete a product successfully', async () => {
      const mockDeletedProduct = {
        _id: mockProductId,
        title: 'Test Product',
        seller: 'user123',
        images: [],
      };

      Product.findByIdAndDelete = jest
        .fn()
        .mockResolvedValue(mockDeletedProduct);

      const res = await request(app)
        .delete(`/api/products/${mockProductId}`)
        .set('Cookie', 'token=user123:seller');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Product deleted successfully');
    });

    test('should purge all associated Cloudinary images on delete', async () => {
      const mockProductWithImages = {
        _id: mockProductId,
        title: 'Product with Images',
        images: [
          { url: 'https://res.cloudinary.com/img1.jpg', publicId: 'pub_id_1' },
          { url: 'https://res.cloudinary.com/img2.jpg', publicId: 'pub_id_2' },
        ],
      };

      Product.findByIdAndDelete = jest
        .fn()
        .mockResolvedValue(mockProductWithImages);

      await request(app)
        .delete(`/api/products/${mockProductId}`)
        .set('Cookie', 'token=user123:seller');

      expect(mockDestroy).toHaveBeenCalledTimes(2);
      expect(mockDestroy).toHaveBeenCalledWith('pub_id_1');
      expect(mockDestroy).toHaveBeenCalledWith('pub_id_2');
    });

    test('should return 404 if product to delete is not found', async () => {
      Product.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/products/${mockProductId}`)
        .set('Cookie', 'token=user123:seller');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Product not found');
    });

    test('should return 401 if not authenticated', async () => {
      const res = await request(app).delete(`/api/products/${mockProductId}`);

      expect(res.status).toBe(401);
      expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});
