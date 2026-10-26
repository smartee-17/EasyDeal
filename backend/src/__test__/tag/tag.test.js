import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import {
  createTag,
  updateTag,
  deleteTag,
  getAllTags,
} from '../../api/controllers/tag.controller.js';

import Tag from '../../api/models/tag.model.js';
import Product from '../../api/models/product.model.js';
import { CacheService } from '../../api/cache/cache.service.js';
import { CacheKeys } from '../../api/cache/cache.keys.js';

// --- MOCKS ---

// Mock Models - provide a proper constructor with save method
jest.mock('../../api/models/tag.model.js', () => {
  const mockTagStore = new Map();

  const toIdString = (value) => value.toString();

  const matchesTagFilter = (doc, filter) => {
    return Object.entries(filter).every(([field, condition]) => {
      if (field === '_id') {
        const value = toIdString(doc._id);
        if (condition && typeof condition === 'object' && '$ne' in condition) {
          return value !== toIdString(condition.$ne);
        }
        return value === toIdString(condition);
      }
      return doc[field] === condition;
    });
  };

  class MockTagDoc {
    constructor({ _id, name, createdAt, updatedAt, createdBy, updatedBy }) {
      this._id = _id;
      this._name = String(name).trim().toLowerCase();
      this.slug = this._name.toLowerCase().replace(/\s+/g, '-');
      this.createdAt = createdAt || new Date();
      this.updatedAt = updatedAt || new Date();
      this.createdBy = createdBy;
      this.updatedBy = updatedBy;
    }

    get name() {
      return this._name;
    }

    set name(value) {
      this._name = String(value).trim().toLowerCase();
      this.slug = this._name.toLowerCase().replace(/\s+/g, '-');
    }

    async save() {
      this.slug = this._name.toLowerCase().replace(/\s+/g, '-');
      this.updatedAt = new Date(this.updatedAt.getTime() + 1000);
      mockTagStore.set(this._id.toString(), this);
      return this;
    }

    toJSON() {
      return {
        _id: this._id,
        name: this.name,
        slug: this.slug,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        createdBy: this.createdBy,
        updatedBy: this.updatedBy,
      };
    }
  }

  // Factory function that acts as the Tag constructor
  function MockTag(data) {
    Object.assign(this, data);
    this._id = data._id || { toString: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) };
    this._name = String(data.name).trim().toLowerCase();
    this.slug = this._name.toLowerCase().replace(/\s+/g, '-');
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
  }

  MockTag.prototype.name = '';
  Object.defineProperty(MockTag.prototype, 'name', {
    get() { return this._name; },
    set(value) {
      this._name = String(value).trim().toLowerCase();
      this.slug = this._name.toLowerCase().replace(/\s+/g, '-');
    },
  });

  MockTag.prototype.save = async function() {
    this.slug = this._name.toLowerCase().replace(/\s+/g, '-');
    this.updatedAt = new Date(this.updatedAt.getTime() + 1000);
    mockTagStore.set(this._id.toString(), this);
    return this;
  };

  MockTag.prototype.toJSON = function() {
    return {
      _id: this._id,
      name: this.name,
      slug: this.slug,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
    };
  };

  // Static methods
  MockTag.findById = jest.fn(async (id) => {
    return mockTagStore.get(id.toString()) || null;
  });

MockTag.findOne = jest.fn(async (filter = {}) => {
    const result = [...mockTagStore.values()].find((tagDoc) => {
      return Object.entries(filter).every(([field, condition]) => {
        if (field === '_id') {
          const value = toIdString(tagDoc._id);
          if (condition && typeof condition === 'object' && '$ne' in condition) {
            return value !== toIdString(condition.$ne);
          }
          return value === toIdString(condition);
        }
        return tagDoc[field] === condition;
      });
    });
    return result || null;
  });

  MockTag.findByIdAndDelete = jest.fn(async (id) => {
    const key = id.toString();
    const doc = mockTagStore.get(key);
    if (!doc) return null;
    mockTagStore.delete(key);
    return doc;
  });

  MockTag.find = jest.fn(() => ({
    sort: jest.fn().mockResolvedValue([]),
  }));

  MockTag.__mockStore = mockTagStore;

  return {
    __esModule: true,
    default: MockTag,
  };
});

jest.mock('../../api/models/product.model.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    find: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock('../../api/cache/cache.service.js', () => ({
  __esModule: true,
  CacheService: {
    get: jest.fn(async () => null),
    set: jest.fn(async () => true),
    del: jest.fn(async () => true),
    clearPattern: jest.fn(),
  },
}));

jest.mock('../../api/cache/cache.keys.js', () => ({
  __esModule: true,
  CacheKeys: {
    product: (id) => `product:${id}`,
  },
}));

// --- APP SETUP ---
const app = express();
app.use(express.json());
app.use(cookieParser());

// Test token parsing - same pattern as product tests
const parseTestToken = (req) => {
  const raw = req.cookies?.token;
  if (!raw) return null;
  const [id, role] = raw.split(':');
  return { id, _id: id, name: 'Test User', role: role || 'user' };
};

// --- protect (mock) ---
const protect = (req, res, next) => {
  const user = parseTestToken(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
      data: null,
    });
  }
  req.user = user;
  next();
};

// --- authorizeRoles (mock) ---
const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions',
        data: null,
      });
    }
    next();
  };

// Routes — same shape/order as api/routes/tag.route.js
app.get('/api/tags/search', getAllTags); // search handled by getAllTags with query
app.get('/api/tags', getAllTags);
app.post('/api/tags', protect, authorizeRoles('admin'), createTag);
app.put('/api/tags/:id', protect, authorizeRoles('admin'), updateTag);
app.delete('/api/tags/:id', protect, authorizeRoles('admin'), deleteTag);

// --- TEST SUITE ---
const VALID_ID = '60c72b2f9b1d8b2b8c8b4567';
const OTHER_ID = '60c72b2f9b1d8b2b8c8b4568';
const MISSING_ID = '60c72b2f9b1d8b2b8c8b9999';
const PRODUCT_ID = '60c72b2f9b1d8b2b8c8c7777';
const PRODUCT_ID_2 = '60c72b2f9b1d8b2b8c8c7778';

const toIdString = (value) => value.toString();

// Shared in-memory store for tags - must be accessible to both test and mock factory
globalThis.mockTagStore = new Map();

describe('Tag Controller — Audit Fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tags — CreatedBy / UpdatedBy on Creation', () => {
    test('sets createdBy and updatedBy to the authenticated admin', async () => {
      const mockTagInstance = {
        _id: VALID_ID,
        name: 'new tag',
        slug: 'new-tag',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-admin-id',
        updatedBy: 'test-admin-id',
        toJSON() { return this; },
        save: jest.fn().mockResolvedValue({
          _id: VALID_ID,
          name: 'new tag',
          slug: 'new-tag',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-admin-id',
          updatedBy: 'test-admin-id',
        }),
      };

      // Add to mock store instead of using mockImplementation
      globalThis.mockTagStore.set(VALID_ID, mockTagInstance);
      Tag.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/tags')
        .set('Cookie', 'token=test-admin-id:admin')
        .send({ name: 'New Tag' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.createdBy).toBe('test-admin-id');
      expect(res.body.data.updatedBy).toBe('test-admin-id');
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
    });

    test('client cannot override createdBy or updatedBy', async () => {
      const mockTagInstance = {
        _id: VALID_ID,
        name: 'audit test',
        slug: 'audit-test',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-admin-id',
        updatedBy: 'test-admin-id',
        toJSON() { return this; },
        save: jest.fn().mockResolvedValue({
          _id: VALID_ID,
          name: 'audit test',
          slug: 'audit-test',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-admin-id',
          updatedBy: 'test-admin-id',
        }),
      };

      // Add to mock store instead of using mockImplementation
      globalThis.mockTagStore.set(VALID_ID, mockTagInstance);
      Tag.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/tags')
        .set('Cookie', 'token=test-admin-id:admin')
        .send({
          name: 'Audit Test',
          createdBy: 'other-admin-id',
          updatedBy: 'other-admin-id',
        });

      expect(res.body.data.createdBy).toBe('test-admin-id');
      expect(res.body.data.updatedBy).toBe('test-admin-id');
    });

    test('returns 403 for non-admin authenticated user', async () => {
      const res = await request(app)
        .post('/api/tags')
        .set('Cookie', 'token=user1:user')
        .send({ name: 'Unauthorized' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied: insufficient permissions');
    });

    test('returns 401 for unauthenticated request', async () => {
      const res = await request(app).post('/api/tags').send({ name: 'Unauthorized' });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/tags/:id — UpdatedBy on Update', () => {
    const baseExistingTag = {
      _id: VALID_ID,
      name: 'featured',
      slug: 'featured',
      createdAt: new Date('2023-10-26T10:30:00.000Z'),
      updatedAt: new Date('2023-10-26T10:30:00.000Z'),
      createdBy: 'admin-a-id',
      updatedBy: 'admin-a-id',
    };

    test('updatedBy changes to the updating admin; createdBy remains immutable', async () => {
      const existingTag = new Tag({
        ...baseExistingTag,
        toJSON() {
          return this;
        },
      });

      Tag.findById.mockResolvedValue(existingTag);
      Tag.findOne.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/tags/${VALID_ID}`)
      .set('Cookie', 'token=admin-b-id:admin')
      .send({ name: 'Updated Tag' });

      expect(res.status).toBe(200);
      expect(res.body.data.updatedBy).toBe('admin-b-id');
      expect(res.body.data.createdBy).toBe('admin-a-id');
      expect(new Date(res.body.data.updatedAt).getTime())
        .toBeGreaterThan(baseExistingTag.updatedAt.getTime());

      expect(new Date(res.body.data.createdAt).getTime())
        .toBe(baseExistingTag.createdAt.getTime());
    });

    test('client cannot override createdBy or updatedBy on update', async () => {
      const existingTag = new Tag({
        ...baseExistingTag,
        toJSON() {
          return this;
        },
        save: jest.fn().mockResolvedValue({
          ...baseExistingTag,
          name: 'audit test',
          slug: 'audit-test',
          updatedBy: 'admin-b-id',
        }),
      });

      Tag.findById.mockResolvedValue(existingTag);
      Tag.findOne.mockResolvedValue(null);
      // Add to mock store instead of mockImplementation
      globalThis.mockTagStore.set(VALID_ID, existingTag);

      const res = await request(app)
        .put(`/api/tags/${VALID_ID}`)
        .set('Cookie', 'token=admin-b-id:admin')
        .send({
          name: 'Audit Test',
          createdBy: 'other-admin-id',
          updatedBy: 'other-admin-id',
        });

      expect(res.body.data.updatedBy).toBe('admin-b-id');
      expect(res.body.data.createdBy).toBe('admin-a-id');
    });

    test('returns 404 for non-existent tag', async () => {
      Tag.findById.mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/tags/${MISSING_ID}`)
        .set('Cookie', 'token=admin1:admin')
        .send({ name: 'Ghost Tag' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Tag not found');
    });

    test('returns 403 for non-admin authenticated user', async () => {
      const res = await request(app)
        .put(`/api/tags/${VALID_ID}`)
        .set('Cookie', 'token=user1:user')
        .send({ name: 'Unauthorized' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied: insufficient permissions');
    });
  });

  describe('DELETE /api/tags/:id — Product cleanup', () => {
    const existingTag = {
      _id: VALID_ID,
      name: 'featured',
      createdAt: new Date('2023-10-26T10:30:00.000Z'),
      updatedAt: new Date('2023-10-26T10:30:00.000Z'),
      createdBy: 'admin-a-id',
      updatedBy: 'admin-a-id',
    };

    test('removes tag ObjectId from referencing products', async () => {
      const product = {
        _id: PRODUCT_ID,
        title: 'Test Product',
        tags: [existingTag._id],
      };

      Tag.findById.mockResolvedValue(existingTag);
      Product.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([product]),
      });
      Product.updateMany.mockResolvedValue({ modifiedCount: 1 });
      Tag.findByIdAndDelete.mockResolvedValue(existingTag);

      const res = await request(app)
        .delete(`/api/tags/${VALID_ID}`)
        .set('Cookie', 'token=admin1:admin');

      expect(res.status).toBe(200);
      expect(Product.updateMany).toHaveBeenCalledWith(
        { tags: existingTag._id },
        { $pull: { tags: existingTag._id } }
      );
    });

    test('deletes the tag document itself', async () => {
      Tag.findById.mockResolvedValue(existingTag);
      Product.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      Product.updateMany.mockResolvedValue({ modifiedCount: 0 });
      Tag.findByIdAndDelete.mockResolvedValue(existingTag);

      const res = await request(app)
        .delete(`/api/tags/${VALID_ID}`)
        .set('Cookie', 'token=admin1:admin');

      expect(res.status).toBe(200);
      expect(Tag.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    });
  });

  describe('GET /api/tags — Response shape includes audit fields', () => {
    test('returns tags with createdBy, updatedBy, createdAt, updatedAt', async () => {
      const mockTags = [
        {
          _id: VALID_ID,
          name: 'featured',
          slug: 'featured',
          createdAt: new Date('2023-10-26T10:30:00.000Z'),
          updatedAt: new Date('2023-10-26T10:30:00.000Z'),
          createdBy: 'admin-a-id',
          updatedBy: 'admin-a-id',
        },
      ];

      Tag.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTags),
      });

      const res = await request(app).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('createdBy');
      expect(res.body.data[0]).toHaveProperty('updatedBy');
      expect(res.body.data[0]).toHaveProperty('createdAt');
      expect(res.body.data[0]).toHaveProperty('updatedAt');
    });
  });
});