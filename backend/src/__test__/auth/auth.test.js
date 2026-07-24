import request from 'supertest';
import app from '../../app.js';
import User from '../../api/models/user.model.js';
import * as tokenLib from '../../api/library/token.js';
import * as emailService from '../../api/library/email/emailService/index.js';

jest.mock('../../api/models/user.model.js');
jest.mock('../../api/library/token.js');
jest.mock('../../api/library/email/emailService/index.js');

const mockUser = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  phone: '08012345678',
  username: 'testuser',
  role: 'user',
  isBlocked: false,
  isEmailVerified: false,
  emailVerificationToken: 'hashedtoken',
  emailVerificationTokenExpire: Date.now() + 30 * 60 * 1000,
  matchPassword: jest.fn(),
  save: jest.fn(),
  toPublic: jest.fn().mockReturnValue({ email: 'test@example.com' }),
};

beforeEach(() => {
  jest.clearAllMocks();
  tokenLib.generateSecureToken.mockReturnValue({ raw: 'rawtoken', hashed: 'hashedtoken' });
  tokenLib.generateAccessToken.mockReturnValue('mock-jwt-token');
  tokenLib.setAuthCookie.mockImplementation(() => {});
  tokenLib.hashToken.mockReturnValue('hashedtoken');
  emailService.sendEmail.mockResolvedValue(true);
});

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('// should create a new user successfully', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '08012345678',
      username: 'testuser',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account created');
  });

  test('// should fail when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please fill all required fields');
  });

  test('// should fail if email already exists', async () => {
    User.findOne.mockResolvedValue({ ...mockUser, email: 'test@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '08012345678',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in use/i);
  });

  test('// should fail if username already exists', async () => {
    User.findOne.mockResolvedValue({ ...mockUser, username: 'testuser', email: 'other@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'new@example.com',
      password: 'password123',
      phone: '08099999999',
      username: 'testuser',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in use/i);
  });

  test('// should reject admin role creation', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      phone: '08012345678',
      role: 'admin',
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin accounts cannot be created/i);
  });

  test('// should fail if role is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
      phone: '08012345678',
      role: 'superuser',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid role/i);
  });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('// should login successfully with valid credentials', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    const res = await request(app).post('/api/auth/login').send({
      emailOrUsername: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login Successful');
  });

  test('// should fail with wrong password', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(false) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    const res = await request(app).post('/api/auth/login').send({
      emailOrUsername: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('// should fail if user does not exist', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const res = await request(app).post('/api/auth/login').send({
      emailOrUsername: 'ghost@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('// should fail if user account is blocked', async () => {
    const blockedUser = { ...mockUser, isBlocked: true, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(blockedUser) });

    const res = await request(app).post('/api/auth/login').send({
      emailOrUsername: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/suspended/i);
  });

  test('// should fail if emailOrUsername or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({
      emailOrUsername: 'test@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });
});

// Logout 
describe('POST /api/auth/logout', () => {
  test('// should logout successfully and clear cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['token=mock-jwt-token']); // simulate logged-in user

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Logged out successfully');
  });

  test('// should still succeed even if no cookie is present', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('// should not crash when malformed request is sent', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['invalidcookieformat']);

    expect(res.status).toBe(200);
  });
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────

describe('GET /api/auth/verify-email/:token', () => {
  test('// should verify email with a valid token', async () => {
    const unverifiedUser = {
      ...mockUser,
      isEmailVerified: false,
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(unverifiedUser);

    const res = await request(app).get('/api/auth/verify-email/validrawtoken');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Email verified successfully');
    expect(unverifiedUser.isEmailVerified).toBe(true);
    expect(unverifiedUser.save).toHaveBeenCalled();
  });

  test('// should fail with an invalid token', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).get('/api/auth/verify-email/invalidtoken');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  test('// should fail if token is expired', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auth/verify-email/expiredtoken');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  test('// should fail if token is malformed', async () => {
    const res = await request(app)
      .get('/api/auth/verify-email/@@@@');

    expect(res.status).toBe(400);
  });
});

// ─── RESEND VERIFICATION ─────────────────────────────────────────────────────

describe('POST /api/auth/resend-verification', () => {
  test('// should resend verification email for an unverified user', async () => {
    const unverifiedUser = {
      ...mockUser,
      isEmailVerified: false,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(unverifiedUser);

    const res = await request(app).post('/api/auth/resend-verification').send({
      email: 'test@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Verification email sent');
  });

  test('// should return generic message if user is not found (security)', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/resend-verification').send({
      email: 'ghost@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);
  });

  test('// should fail if email is already verified', async () => {
    const verifiedUser = { ...mockUser, isEmailVerified: true };
    User.findOne.mockResolvedValue(verifiedUser);

    const res = await request(app).post('/api/auth/resend-verification').send({
      email: 'test@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already verified/i);
  });

  test('// should fail if email field is missing', async () => {
    const res = await request(app).post('/api/auth/resend-verification').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('email is required');
  });
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  test('// should send reset email if user exists', async () => {
    const user = {
      ...mockUser,
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(emailService.sendEmail).toHaveBeenCalled();
  });

  test('// should NOT reveal if email does not exist (security)', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);
  });

  test('// should fail if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });
});

// ─── RESET PASSWORD ─────────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  test('// should reset password with valid token', async () => {
    const user = {
      ...mockUser,
      password: 'oldPassword',
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const res = await request(app)
      .post('/api/auth/reset-password/validtoken')
      .send({ newPassword: 'newPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successful/i);
    expect(user.save).toHaveBeenCalled();
  });

  test('// should fail if password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/validtoken')
      .send({ newPassword: '123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 6/i);
  });

  test('// should fail with invalid or expired token', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post('/api/auth/reset-password/badtoken')
      .send({ newPassword: 'newPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });
});

// ─── RESEND API INTEGRATION (MANUAL ONLY) ──────────────────────────────────── 


const RUN_RESEND_TEST = process.env.RUN_RESEND_TEST === 'true';

(RUN_RESEND_TEST ? describe : describe.skip)(
  'MANUAL: Resend API config smoke test via /api/auth/resend-verification',
  () => {
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const testEmail = `rajivkumar8163@gmail.com`;
    const testUsername = `rajiv_${Date.now()}`;

    let createdUserId = null;

    beforeAll(async () => {
      jest.unmock('../api/library/email/emailService/index.js');
      jest.unmock('../api/library/token.js');
    });

    afterAll(async () => {

      if (createdUserId) {
        await User.deleteOne({ _id: createdUserId }).catch(() => {
          console.warn('[Resend smoke test] Cleanup failed for user:', createdUserId);
        });
      }
    });

    test('// should register a temp user and trigger resend-verification against live Resend API', async () => {

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Smoke Test User',
          email: testEmail,
          password: 'Test@12345',
          phone: '08098765432',
          username: testUsername,
          role: 'user',
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);

      createdUserId = registerRes.body?.data?._id ?? null;

      const resendRes = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: testEmail });

      expect(resendRes.status).toBe(200);
      expect(resendRes.body.message).toMatch(/verification email sent/i);
    });
  }
);