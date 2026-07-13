import express from 'express';
import request from 'supertest';

// ─── 1. MODULE MOCKS ─────────────────────────────────────────────────────────

// ── 1a. User model ────────────────────────────────────────────────────────────
jest.mock('../../api/models/user.model.js', () => {
  const mockToPublic = jest.fn().mockReturnValue({
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  });

  const mockUserInstance = {
    _id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    avatar: null,
    toPublic: mockToPublic,
  };

  return {
    __esModule: true,
    default: {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      _mockInstance: mockUserInstance,
      _mockToPublic: mockToPublic,
    },
  };
});

// ── 1b. Cloudinary config 
jest.mock('../../config/cloudinary.js', () => {
  const _state = {
    simulateFileUpload: false,
    mockFile: {
      path: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      filename: 'EasyDeal/sample_public_id',
      mimetype: 'image/jpeg',
      originalname: 'avatar.jpg',
    },
  };

  const mockDestroy = jest.fn();

  const mockUpload = {
    _state, 
    single: jest.fn(
      () => (req, _res, next) => {
        if (_state.simulateFileUpload) {
          req.file = { ..._state.mockFile };
        }
        next();
      },
    ),
    array: jest.fn(() => (_req, _res, next) => next()),
    fields: jest.fn(() => (_req, _res, next) => next()),
    none: jest.fn(() => (_req, _res, next) => next()),
  };

  return {
    __esModule: true,
    default: {
      uploader: { destroy: mockDestroy },
    },
    initCloudinary: jest.fn(),
    upload: mockUpload,
  };
});

// ── 1c. Auth middleware ───────────────────────────────────────────────────────
jest.mock('../../api/middlewares/auth.middleware.js', () => {
  const _state = { simulateFail: false };

  const protect = (req, res, next) => {
    if (_state.simulateFail) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    req.user = { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'user' };
    next();
  };

  protect._state = _state; 

  return { __esModule: true, default: protect };
});

jest.mock('../../api/library/utils.js', () => ({
  sendResponse: jest.fn((res, status, success, message, data) =>
    res.status(status).json({ success, message, ...data }),
  ),
}));

// ── 1d. Cache wrapper ───────────────────────────────────────────────────────
jest.mock('../../api/cache/cache.wrapper.js', () => ({
  cacheWrapper: jest.fn(),
  cacheDelete: jest.fn(),
}));

// ── 1e. CacheKeys ────────────────────────────────────────────────────────────
jest.mock('../../api/cache/cache.keys.js', () => ({
  CacheKeys: {
    user: jest.fn((id) => `user:${id}`),
  },
}));


// ─── 2. IMPORTS ──────────────────────────────────────────────────────────────


import userRoutes from '../../api/routes/user.route.js';
import User from '../../api/models/user.model.js';
import cloudinary, { upload } from '../../config/cloudinary.js';
import protect from '../../api/middlewares/auth.middleware.js';
import { cacheWrapper, cacheDelete } from '../../api/cache/cache.wrapper.js';
import { CacheKeys } from '../../api/cache/cache.keys.js';

// ─── 3. MINIMAL TEST APP ─────────────────────────────────────────────────────

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/user', userRoutes);
  return app;
};

const app = buildApp();

// ─── 4. RESET HELPER ─────────────────────────────────────────────────────────

const resetMocks = () => {

  protect._state.simulateFail = false;

 
  upload._state.simulateFileUpload = false;


  const instance = User._mockInstance;
  instance._id        = 'user-123';
  instance.name       = 'Test User';
  instance.email      = 'test@example.com';
  instance.role       = 'user';
  instance.avatar     = null;

  User._mockToPublic.mockReturnValue({
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  });

  instance.toPublic = User._mockToPublic;

  User.findById.mockResolvedValue(instance);
  User.findByIdAndUpdate.mockResolvedValue(instance);

  cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

  jest.clearAllMocks();

  User._mockToPublic.mockReturnValue({
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  });
  instance.toPublic = User._mockToPublic;
  User.findById.mockResolvedValue(instance);
  User.findByIdAndUpdate.mockResolvedValue(instance);
  cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

  // Re-establish CacheKeys.user mock after clearAllMocks
  CacheKeys.user.mockImplementation((id) => `user:${id}`);

  // cacheWrapper defaults to simulating a cache miss: runs fetchFunction and returns result
  cacheWrapper.mockImplementation(async ({ fetchFunction }) => fetchFunction());

  cacheDelete.mockResolvedValue(undefined);
};

// ─── 5. TEST SUITES ──────────────────────────────────────────────────────────

describe('User Controller', () => {
  beforeEach(resetMocks);

  // ── 5.1  Auth failures ────────────────────────────────────────────────────

  describe('Auth failures', () => {
    test('GET /me → 401 when protect middleware rejects', async () => {
      protect._state.simulateFail = true;

      const res = await request(app).get('/api/user/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test('PATCH /me → 401 when protect middleware rejects', async () => {
      protect._state.simulateFail = true;

      const res = await request(app).patch('/api/user/me').send({ name: 'New' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  // ── 5.2  GET /api/user/me ─────────────────────────────────────────────────

  describe('GET /api/user/me', () => {
    test('200 – returns public user profile', async () => {
      const res = await request(app).get('/api/user/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile fetched successfully');
      expect(res.body.user).toMatchObject({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });
    });

    test('200 – queries DB with id from req.user', async () => {
      await request(app).get('/api/user/me');

      expect(User.findById).toHaveBeenCalledWith('user-123');
      expect(User.findById).toHaveBeenCalledTimes(1);
    });

    test('404 – when findById returns null (user deleted mid-session)', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).get('/api/user/me');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    test('500 – on unexpected DB error', async () => {
      User.findById.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app).get('/api/user/me');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
      expect(res.body.error).toBe('DB connection lost');
    });

    // ── 5.2.1  Caching behavior ───────────────────────────────────────────

    test('CACHE – cacheWrapper is called with correct key and ttl on GET /me', async () => {
      await request(app).get('/api/user/me');

      expect(cacheWrapper).toHaveBeenCalledTimes(1);
      expect(cacheWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'user:user-123',
          ttl: 3600,
          fetchFunction: expect.any(Function),
        }),
      );
    });

    test('CACHE – CacheKeys.user is called with the authenticated user id', async () => {
      await request(app).get('/api/user/me');

      expect(CacheKeys.user).toHaveBeenCalledWith('user-123');
    });

    test('CACHE – on cache miss, fetchFunction calls User.findById and returns toPublic result', async () => {
      // cacheWrapper executes fetchFunction (cache miss simulation — default in resetMocks)
      await request(app).get('/api/user/me');

      expect(User.findById).toHaveBeenCalledWith('user-123');
      expect(User._mockToPublic).toHaveBeenCalledTimes(1);
    });

    test('CACHE – on cache hit, User.findById is NOT called', async () => {
      const cachedProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };
      // Simulate a cache hit: cacheWrapper returns cached data without calling fetchFunction
      cacheWrapper.mockResolvedValue(cachedProfile);

      const res = await request(app).get('/api/user/me');

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject(cachedProfile);
      expect(User.findById).not.toHaveBeenCalled();
    });

    test('CACHE – response user data matches toPublic format from fetchFunction', async () => {
      const publicProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };
      User._mockToPublic.mockReturnValue(publicProfile);

      const res = await request(app).get('/api/user/me');

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject(publicProfile);
    });

    test('CACHE – 404 when fetchFunction inside cacheWrapper returns null', async () => {
      // Simulate cache miss where DB also returns null
      cacheWrapper.mockResolvedValue(null);

      const res = await request(app).get('/api/user/me');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  // ── 5.3  PATCH /api/user/me ───────────────────────────────────────────────

  describe('PATCH /api/user/me', () => {

    // ── 5.3.1  Successful field updates ──────────────────────────────────

    test('200 – updates allowed fields and returns updated profile', async () => {
      const updatedInstance = {
        ...User._mockInstance,
        name: 'Updated Name',
        phone: '08012345678',
        toPublic: jest.fn().mockReturnValue({
          id: 'user-123',
          name: 'Updated Name',
          phone: '08012345678',
          email: 'test@example.com',
          role: 'user',
        }),
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedInstance);

      const res = await request(app)
        .patch('/api/user/me')
        .send({ name: 'Updated Name', phone: '08012345678' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(res.body.user.name).toBe('Updated Name');
    });

    test('200 – passes { new: true, runValidators: true } to findByIdAndUpdate', async () => {
      await request(app).patch('/api/user/me').send({ name: 'X' });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-123',
        expect.any(Object),
        { new: true, runValidators: true },
      );
    });

    test('200 – all six allowed fields are forwarded in the update object', async () => {
      const payload = {
        name: 'N',
        email: 'n@n.com',
        phone: '0800',
        username: 'uname',
        bio: 'A bio',
        whatsappNumber: '0900',
      };

      await request(app).patch('/api/user/me').send(payload);

      const [, updates] = User.findByIdAndUpdate.mock.calls[0];
      expect(updates).toMatchObject(payload);
    });

    // ── 5.3.2  Field allowlist enforcement ───────────────────────────────

    test('200 – strips non-whitelisted fields (role, password, __v)', async () => {
      await request(app)
        .patch('/api/user/me')
        .send({ name: 'Safe', role: 'admin', password: 'hack', __v: 99 });

      const [, updates] = User.findByIdAndUpdate.mock.calls[0];
      expect(updates).toHaveProperty('name', 'Safe');
      expect(updates).not.toHaveProperty('role');
      expect(updates).not.toHaveProperty('password');
      expect(updates).not.toHaveProperty('__v');
    });

    test('200 – empty body → update object contains no allowed fields', async () => {
      await request(app).patch('/api/user/me').send({});

      const [, updates] = User.findByIdAndUpdate.mock.calls[0];
      ['name', 'email', 'phone', 'username', 'bio', 'whatsappNumber'].forEach((f) =>
        expect(updates).not.toHaveProperty(f),
      );
    });

    // ── 5.3.3  Avatar upload ──────────────────────────────────────────────

    test('200 – avatar object is added to update when multer attaches a file', async () => {
      upload._state.simulateFileUpload = true;

      const { path, filename } = upload._state.mockFile;
      const updatedInstance = {
        ...User._mockInstance,
        avatar: { url: path, publicId: filename },
        toPublic: jest.fn().mockReturnValue({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          avatar: { url: path, publicId: filename },
        }),
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedInstance);

      const res = await request(app).patch('/api/user/me').send({});

      expect(res.status).toBe(200);

      const [, updates] = User.findByIdAndUpdate.mock.calls[0];
      expect(updates.avatar).toMatchObject({ url: path, publicId: filename });
    });

    test('200 – old Cloudinary image is destroyed before saving new one', async () => {
      User._mockInstance.avatar = { url: 'https://old.url', publicId: 'old_public_id' };
      User.findById.mockResolvedValue(User._mockInstance);
      upload._state.simulateFileUpload = true;

      await request(app).patch('/api/user/me').send({});

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('old_public_id');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
    });

    test('200 – cloudinary.destroy is NOT called when user has no prior avatar', async () => {
      User._mockInstance.avatar = null;
      User.findById.mockResolvedValue(User._mockInstance);
      upload._state.simulateFileUpload = true;

      await request(app).patch('/api/user/me').send({});

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    test('200 – cloudinary.destroy is NOT called when no file is in the request', async () => {
      User._mockInstance.avatar = { url: 'https://old.url', publicId: 'old_public_id' };
      User.findById.mockResolvedValue(User._mockInstance);
      upload._state.simulateFileUpload = false;

      await request(app).patch('/api/user/me').send({ name: 'Text only' });

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    // ── 5.3.4  Error paths ────────────────────────────────────────────────

    test('404 – when findById returns null', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app).patch('/api/user/me').send({ name: 'X' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    test('500 – on DB error from findById', async () => {
      User.findById.mockRejectedValue(new Error('Mongo timeout'));

      const res = await request(app).patch('/api/user/me').send({ name: 'X' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error during update');
      expect(res.body.error).toBe('Mongo timeout');
    });

    test('500 – on DB error from findByIdAndUpdate', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Write conflict'));

      const res = await request(app).patch('/api/user/me').send({ name: 'X' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error during update');
      expect(res.body.error).toBe('Write conflict');
    });

    test('500 – on Cloudinary destroy failure (controller propagates the error)', async () => {
      User._mockInstance.avatar = { url: 'https://old.url', publicId: 'old_public_id' };
      User.findById.mockResolvedValue(User._mockInstance);
      cloudinary.uploader.destroy.mockRejectedValue(new Error('Cloudinary unreachable'));
      upload._state.simulateFileUpload = true;

      const res = await request(app).patch('/api/user/me').send({});

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error during update');
    });

    // ── 5.3.5  Cache invalidation ─────────────────────────────────────────

    test('CACHE – cacheDelete is called with correct key after successful updateMe', async () => {
      await request(app).patch('/api/user/me').send({ name: 'Updated Name' });

      expect(cacheDelete).toHaveBeenCalledTimes(1);
      expect(cacheDelete).toHaveBeenCalledWith('user:user-123');
    });

    test('CACHE – CacheKeys.user is called with the authenticated user id on updateMe', async () => {
      await request(app).patch('/api/user/me').send({ name: 'Updated Name' });

      expect(CacheKeys.user).toHaveBeenCalledWith('user-123');
    });

    test('CACHE – cacheDelete is called even when no fields are changed (empty body)', async () => {
      await request(app).patch('/api/user/me').send({});

      expect(cacheDelete).toHaveBeenCalledTimes(1);
      expect(cacheDelete).toHaveBeenCalledWith('user:user-123');
    });

    test('CACHE – cacheDelete is called after avatar upload succeeds', async () => {
      upload._state.simulateFileUpload = true;
      const { path, filename } = upload._state.mockFile;
      const updatedInstance = {
        ...User._mockInstance,
        avatar: { url: path, publicId: filename },
        toPublic: jest.fn().mockReturnValue({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          avatar: { url: path, publicId: filename },
        }),
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedInstance);

      await request(app).patch('/api/user/me').send({});

      expect(cacheDelete).toHaveBeenCalledWith('user:user-123');
    });

    test('CACHE – cacheDelete is NOT called when findById returns null (early 404)', async () => {
      User.findById.mockResolvedValue(null);

      await request(app).patch('/api/user/me').send({ name: 'X' });

      expect(cacheDelete).not.toHaveBeenCalled();
    });

    test('CACHE – cacheDelete is NOT called when findByIdAndUpdate throws', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Write conflict'));

      await request(app).patch('/api/user/me').send({ name: 'X' });

      expect(cacheDelete).not.toHaveBeenCalled();
    });

    test('CACHE – updateMe still returns correct updated user after cache invalidation', async () => {
      const updatedInstance = {
        ...User._mockInstance,
        name: 'Post-Cache Name',
        toPublic: jest.fn().mockReturnValue({
          id: 'user-123',
          name: 'Post-Cache Name',
          email: 'test@example.com',
          role: 'user',
        }),
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedInstance);

      const res = await request(app).patch('/api/user/me').send({ name: 'Post-Cache Name' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Post-Cache Name');
      expect(cacheDelete).toHaveBeenCalledWith('user:user-123');
    });
  });
});