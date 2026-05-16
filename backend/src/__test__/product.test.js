import request from 'supertest';
import app from '../app.js';
import Product from '../api/models/product.model.js';
import cloudinary from 'cloudinary';
import multer from 'multer';

// ─── Mock custom config with exact ES Module matching ────────────────────────
jest.mock('../config/cloudinary.js', () => {
  const mockUpload = {
    array: () => (req, _res, next) => next(),
    single: () => (req, _res, next) => next(),
  };
  return {
    __esModule: true,
    default: {
      v2: {
        config: jest.fn(),
        uploader: { destroy: jest.fn() },
      },
    },
    upload: mockUpload,
  };
});

// ─── Mock core packages ──────────────────────────────────────────────────────
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn(),
    },
    url: jest.fn(),
    image: jest.fn(),
  },
}));

jest.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('multer', () => {
  const multerInstance = {
    array: () => (req, _res, next) => next(),
    single: () => (req, _res, next) => next(),
  };
  const multer = jest.fn(() => multerInstance);
  multer.memoryStorage = jest.fn();
  multer.diskStorage = jest.fn();
  return multer;
});

// Auth middleware mock
jest.mock('../api/middlewares/auth.middleware.js', () => ({
  protect: (req, _res, next) => {
    req.user = { _id: 'user123' };
    next();
  },
}));

jest.mock('../api/models/product.model.js');

// Grab the destroy spy from the mocked cloudinary package
const mockDestroy = jest.requireMock('cloudinary').v2.uploader.destroy;

// ─── Shared mock data ─────────────────────────────────────────────────────────
const mockProduct = {
  _id: 'product123',
  title: 'Stealth Pro TKL Keyboard',
  description: 'Ultra-compact Tenkeyless TKL design.',
  price: 124.99,
  category: 'Peripherals',
  images: [
    {
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: 'sample',
    },
  ],
  isAvailable: true,
  seller: 'user123',
  save: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDestroy.mockResolvedValue({ result: 'ok' });
});

// ─── GET ALL PRODUCTS ─────────────────────────────────────────────────────────

describe('GET /api/products', () => {
  test('// should return all products successfully', async () => {
    Product.find.mockResolvedValue([mockProduct]);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Products retrieved successfully');
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(1);
  });

  test('// should return an empty array when no products exist', async () => {
    Product.find.mockResolvedValue([]);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  test('// should return 500 on database error', async () => {
    Product.find.mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});

// ─── GET PRODUCT BY ID ────────────────────────────────────────────────────────

describe('GET /api/products/:id', () => {
  test('// should return a single product by ID', async () => {
    Product.findById.mockResolvedValue(mockProduct);

    const res = await request(app).get('/api/products/product123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Product retrieved successfully');
    expect(res.body.data._id).toBe('product123');
  });

  test('// should return 404 when product is not found', async () => {
    Product.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/products/nonexistentid');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  test('// should return 500 on database error', async () => {
    Product.findById.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/products/product123');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});

// ─── CREATE PRODUCT ───────────────────────────────────────────────────────────

describe('POST /api/products', () => {
  test('// should create a product successfully', async () => {
    const savedProduct = { ...mockProduct, images: [] };
    Product.mockImplementation(() => ({
      ...savedProduct,
      save: jest.fn().mockResolvedValue(savedProduct),
    }));

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer mock-jwt-token')
      .attach('images', Buffer.from('img1'), 'img1.jpg')
      .attach('images', Buffer.from('img2'), 'img2.jpg')
      .send({
        title: 'Stealth Pro TKL Keyboard',
        description: 'Ultra-compact Tenkeyless TKL design.',
        price: 124.99,
        category: 'Peripherals',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Product created successfully');
  });

  test('// should reject when more than 5 images are uploaded', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer mock-jwt-token')
      .attach('images', Buffer.from('img1'), 'img1.jpg')
      .attach('images', Buffer.from('img2'), 'img2.jpg')
      .attach('images', Buffer.from('img3'), 'img3.jpg')
      .attach('images', Buffer.from('img4'), 'img4.jpg')
      .attach('images', Buffer.from('img5'), 'img5.jpg')
      .attach('images', Buffer.from('img6'), 'img6.jpg');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Maximum of 5 images allowed');
  });

  test('// should return 500 on save failure', async () => {
    Product.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error('Save failed')),
    }));

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer mock-jwt-token')
      .send({
        title: 'Failing Product',
        description: 'This will fail.',
        price: 50,
        category: 'Test',
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});

// ─── UPDATE PRODUCT ───────────────────────────────────────────────────────────

describe('PUT /api/products/:id', () => {
  test('// should update product fields successfully', async () => {
    const updatableProduct = {
      ...mockProduct,
      save: jest.fn().mockResolvedValue(true),
    };
    Product.findById.mockResolvedValue(updatableProduct);

    const res = await request(app)
      .put('/api/products/product123')
      .set('Authorization', 'Bearer mock-jwt-token')
      .send({ price: 99.99, title: 'Updated Keyboard' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Product updated successfully');
  });

  test('// should return 404 if product does not exist', async () => {
    Product.findById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/products/nonexistentid')
      .set('Authorization', 'Bearer mock-jwt-token')
      .send({ price: 99.99 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  test('// should reject when more than 5 new images are uploaded', async () => {
    Product.findById.mockResolvedValue({ ...mockProduct, save: jest.fn() });

    const res = await request(app)
      .put('/api/products/product123')
      .set('Authorization', 'Bearer mock-jwt-token')
      .attach('images', Buffer.from('img1'), 'img1.jpg')
      .attach('images', Buffer.from('img2'), 'img2.jpg')
      .attach('images', Buffer.from('img3'), 'img3.jpg')
      .attach('images', Buffer.from('img4'), 'img4.jpg')
      .attach('images', Buffer.from('img5'), 'img5.jpg')
      .attach('images', Buffer.from('img6'), 'img6.jpg');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Maximum of 5 images allowed');
  });

  test('// should delete old Cloudinary images when new ones are provided', async () => {
    const productWithImages = {
      ...mockProduct,
      images: [
        {
          url: 'https://res.cloudinary.com/demo/old1.jpg',
          publicId: 'old_public_id_1',
        },
        {
          url: 'https://res.cloudinary.com/demo/old2.jpg',
          publicId: 'old_public_id_2',
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };
    Product.findById.mockResolvedValue(productWithImages);

    await request(app)
      .put('/api/products/product123')
      .set('Authorization', 'Bearer mock-jwt-token')
      .attach('images', Buffer.from('newimg'), 'new.jpg');

    expect(mockDestroy).toHaveBeenCalledWith('old_public_id_1');
    expect(mockDestroy).toHaveBeenCalledWith('old_public_id_2');
  });

  test('// should return 500 on database error', async () => {
    Product.findById.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .put('/api/products/product123')
      .set('Authorization', 'Bearer mock-jwt-token')
      .send({ price: 50 });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});

// ─── DELETE PRODUCT ───────────────────────────────────────────────────────────

describe('DELETE /api/products/:id', () => {
  test('// should delete a product successfully', async () => {
    Product.findByIdAndDelete.mockResolvedValue(mockProduct);

    const res = await request(app)
      .delete('/api/products/product123')
      .set('Authorization', 'Bearer mock-jwt-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Product deleted successfully');
  });

  test('// should purge all associated Cloudinary images on delete', async () => {
    const productWithImages = {
      ...mockProduct,
      images: [
        {
          url: 'https://res.cloudinary.com/demo/img1.jpg',
          publicId: 'pub_id_1',
        },
        {
          url: 'https://res.cloudinary.com/demo/img2.jpg',
          publicId: 'pub_id_2',
        },
      ],
    };
    Product.findByIdAndDelete.mockResolvedValue(productWithImages);

    await request(app)
      .delete('/api/products/product123')
      .set('Authorization', 'Bearer mock-jwt-token');

    expect(mockDestroy).toHaveBeenCalledTimes(2);
    expect(mockDestroy).toHaveBeenCalledWith('pub_id_1');
    expect(mockDestroy).toHaveBeenCalledWith('pub_id_2');
  });

  test('// should return 404 when product does not exist', async () => {
    Product.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/products/nonexistentid')
      .set('Authorization', 'Bearer mock-jwt-token');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  test('// should return 500 on database error', async () => {
    Product.findByIdAndDelete.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .delete('/api/products/product123')
      .set('Authorization', 'Bearer mock-jwt-token');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});
