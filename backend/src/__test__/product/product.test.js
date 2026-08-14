import request from 'supertest';
import express from 'express';

// Controller imports (going from src/__test__/product/ -> src/controllers/)
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../api/controllers/product.controller.js';

// Model imports (going from src/__test__/product/ -> src/models/)
import Product from '../../api/models/product.model.js';

// Config imports (going from src/__test__/product/ -> root backend/config/)
import cloudinary from '../../config/cloudinary.js';

// --- MOCKS ---

// Mock Models
jest.mock('../../api/models/product.model.js');
jest.mock('../../api/models/tag.model.js');
jest.mock('../../api/models/user.model.js');

// Mock Cache (going from src/__test__/product/ -> src/cache/)
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

// Mock Vision AI (going from src/__test__/product/ -> src/library/)
jest.mock('../../api/library/visionAi.js', () => ({
  generateAltText: jest
    .fn()
    .mockResolvedValue({ detailed: 'AI generated alt text' }),
}));

// --- APP SETUP ---
const app = express();
app.use(express.json());

// Mock Auth Middleware attaching user
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.user = { _id: 'user123', name: 'Test User' };
  }
  next();
});

// Routes
app.get('/api/products', getAllProducts);
app.get('/api/products/:id', getProductById);
app.post('/api/products', createProduct);
app.put('/api/products/:id', updateProduct);
app.delete('/api/products/:id', deleteProduct);

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
    test('should retrieve all products successfully', async () => {
      const mockProducts = [{ title: 'Keyboard', price: 100 }];

      Product.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockProducts),
      });

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockProducts);
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
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockProduct);
    });

    test('should return 404 if product not found', async () => {
      Product.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app).get(`/api/products/${mockProductId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Product not found');
    });
  });

  /* ==========================================
     PUT /api/products/:id
  ========================================== */
  describe('PUT /api/products/:id', () => {
    test('should update product fields successfully', async () => {
      const mockProductInstance = {
        _id: mockProductId,
        title: 'Original Keyboard',
        price: 50,
        seller: 'user123', // Matches req.user._id
        images: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Product.findById = jest.fn().mockResolvedValue(mockProductInstance);

      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({ price: 99.99, title: 'Updated Keyboard' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product updated successfully');
      expect(mockProductInstance.save).toHaveBeenCalled();
    });

    test('should return 403 if user is not the seller', async () => {
      const mockProductInstance = {
        _id: mockProductId,
        seller: 'otherUser456', // Does not match req.user._id
        images: [],
      };

      Product.findById = jest.fn().mockResolvedValue(mockProductInstance);

      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({ title: 'Unauthorized Update' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized to update this product');
    });

    test('should return 404 if product to update is not found', async () => {
      Product.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/products/${mockProductId}`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
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
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
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
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(mockDestroy).toHaveBeenCalledTimes(2);
      expect(mockDestroy).toHaveBeenCalledWith('pub_id_1');
      expect(mockDestroy).toHaveBeenCalledWith('pub_id_2');
    });

    test('should return 404 if product to delete is not found', async () => {
      Product.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/products/${mockProductId}`)
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Product not found');
    });
  });
});
