import request from 'supertest';
import app from '../../app.js';
import User from '../../api/models/user.model.js';
import * as tokenLib from '../../api/library/token.js';
import * as emailService from '../../api/library/email/emailService/index.js';
import * as usernameLib from '../../api/library/username.js';
import { PASSWORD_MIN_LENGTH } from '../../api/library/validation.js';

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
  usernameLib.generateUniqueUsername.mockResolvedValue('default_user_abc123');
});

// The username generator is injected separately from the model mock so its
// collision loop can be driven deterministically.
jest.mock('../../api/library/username.js', () => ({
  generateUniqueUsername: jest.fn(),
}));

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('// should create a new user successfully', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUser);
    usernameLib.generateUniqueUsername.mockResolvedValue('test_user_abc123');

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

  test('// should NOT return the JWT in the response body (cookie-only auth)', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUser);
    usernameLib.generateUniqueUsername.mockResolvedValue('test_user_abc123');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '08012345678',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).not.toHaveProperty('token');
    // The cookie is still issued.
    expect(tokenLib.setAuthCookie).toHaveBeenCalled();
  });

  test('// should register a Buyer as role "user"', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ ...mockUser, role: 'user' });
    usernameLib.generateUniqueUsername.mockResolvedValue('buyer_abc123');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Buyer One',
      email: 'buyer@example.com',
      password: 'password123',
      phone: '08011111111',
      role: 'user',
    });

    expect(res.status).toBe(201);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'user' }));
  });

  test('// should register a Seller as role "seller"', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ ...mockUser, role: 'seller' });
    usernameLib.generateUniqueUsername.mockResolvedValue('seller_abc123');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Seller One',
      email: 'seller@example.com',
      password: 'password123',
      phone: '08022222222',
      role: 'seller',
    });

    expect(res.status).toBe(201);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'seller' }));
  });

  test('// should generate the username server-side and ignore any client value', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUser);
    usernameLib.generateUniqueUsername.mockResolvedValue('generated_name_abc123');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '08012345678',
      username: 'attacker-chosen-name',
    });

    expect(res.status).toBe(201);
    expect(usernameLib.generateUniqueUsername).toHaveBeenCalledWith('Test User');
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'generated_name_abc123' }),
    );
  });

  test('// should not require a username from the client', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUser);
    usernameLib.generateUniqueUsername.mockResolvedValue('nouser_abc123');

    const res = await request(app).post('/api/auth/register').send({
      name: 'No Username',
      email: 'nouser@example.com',
      password: 'password123',
      phone: '08033333333',
    });

    expect(res.status).toBe(201);
  });

  test('// should normalise email casing before saving', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUser);
    usernameLib.generateUniqueUsername.mockResolvedValue('case_abc123');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Mixed Case',
      email: '  MiXeD@Example.COM  ',
      password: 'password123',
      phone: '08044444444',
    });

    expect(res.status).toBe(201);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'mixed@example.com' }),
    );
  });

  test('// should reject an email that duplicates an existing one regardless of case', async () => {
    // Stored lowercase; client sends a different casing for the same address.
    User.findOne.mockResolvedValue({ ...mockUser, email: 'taken@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'TAKEN@Example.com',
      password: 'password123',
      phone: '08099999999',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email already in use/i);
  });

  test('// should reject a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pass',
      email: 'short@example.com',
      password: '1234567',
      phone: '08055555555',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/i);
  });

  test('// should accept a password of exactly 8 characters', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUser);
    usernameLib.generateUniqueUsername.mockResolvedValue('eight_abc123');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Eight Chars',
      email: 'eight@example.com',
      password: 'abcd1234',
      phone: '08066666666',
    });

    expect(res.status).toBe(201);
  });

  test('// should translate a duplicate-key race into a controlled 400, not a 500', async () => {
    User.findOne.mockResolvedValue(null);
    // Simulates losing the race: the unique index rejects at write time.
    User.create.mockRejectedValue(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }));
    usernameLib.generateUniqueUsername.mockResolvedValue('race_abc123');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Race Condition',
      email: 'race@example.com',
      password: 'password123',
      phone: '08077777777',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
    expect(res.body).not.toHaveProperty('error');
  });

  test('// should not leak internal error details on an unexpected failure', async () => {
    User.findOne.mockRejectedValue(new Error('mongodb connection string leaked'));

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '08012345678',
    });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Server error');
    expect(JSON.stringify(res.body)).not.toMatch(/connection string/i);
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

  test('// should fail if phone already exists', async () => {
    User.findOne.mockResolvedValue({ ...mockUser, email: 'other@example.com', phone: '08012345678' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'new@example.com',
      password: 'password123',
      phone: '08012345678',
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

  test('// should login using a username as well as an email', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    const res = await request(app).post('/api/auth/login').send({
      emailOrUsername: 'testuser',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    // The username branch must be offered verbatim, not lowercased.
    expect(User.findOne).toHaveBeenCalledWith({
      $or: [{ email: 'testuser' }, { username: 'testuser' }],
    });
  });

  test('// should look the email up case-insensitively', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    await request(app).post('/api/auth/login').send({
      emailOrUsername: 'TEST@Example.COM',
      password: 'password123',
    });

    expect(User.findOne).toHaveBeenCalledWith({
      $or: [{ email: 'test@example.com' }, { username: 'TEST@Example.COM' }],
    });
  });

  test('// should trim surrounding whitespace from the identifier', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    const res = await request(app).post('/api/auth/login').send({
      emailOrUsername: '  test@example.com  ',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(User.findOne).toHaveBeenCalledWith({
      $or: [{ email: 'test@example.com' }, { username: 'test@example.com' }],
    });
  });

  test('// should not return the JWT in the response body (cookie-only auth)', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    const res = await request(app).post('/api/auth/login').send({
      emailOrUsername: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('token');
    expect(tokenLib.setAuthCookie).toHaveBeenCalled();
  });

  test('// rememberMe=false should request a 1-day session', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    await request(app).post('/api/auth/login').send({
      emailOrUsername: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });

    expect(tokenLib.generateAccessToken).toHaveBeenCalledWith(expect.anything(), false);
    expect(tokenLib.setAuthCookie).toHaveBeenCalledWith(expect.anything(), 'mock-jwt-token', false);
  });

  test('// rememberMe=true should request a 30-day session', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    await request(app).post('/api/auth/login').send({
      emailOrUsername: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    });

    expect(tokenLib.generateAccessToken).toHaveBeenCalledWith(expect.anything(), true);
    expect(tokenLib.setAuthCookie).toHaveBeenCalledWith(expect.anything(), 'mock-jwt-token', true);
  });

  test('// should default rememberMe to false when omitted', async () => {
    const userWithPass = { ...mockUser, matchPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(userWithPass) });

    await request(app).post('/api/auth/login').send({
      emailOrUsername: 'test@example.com',
      password: 'password123',
    });

    expect(tokenLib.generateAccessToken).toHaveBeenCalledWith(expect.anything(), false);
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
    expect(res.body.message).toMatch(/at least 8/i);
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

// ─── PASSWORD POLICY CONSISTENCY ─────────────────────────────────────────────
// Registration, password reset and the schema all read the same constant, so a
// password accepted by one flow can never be rejected by another.

describe('Password policy consistency', () => {
  test(`// approved minimum length should be ${PASSWORD_MIN_LENGTH}`, () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  test('// register and reset-password should enforce the same minimum', async () => {
    const tooShort = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);

    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Short Pass',
      email: 'consistent@example.com',
      password: tooShort,
      phone: '08088888888',
    });
    expect(registerRes.status).toBe(400);
    expect(registerRes.body.message).toMatch(new RegExp(`at least ${PASSWORD_MIN_LENGTH} characters`, 'i'));

    const resetRes = await request(app)
      .post('/api/auth/reset-password/validtoken')
      .send({ newPassword: tooShort });
    expect(resetRes.status).toBe(400);
    expect(resetRes.body.message).toMatch(new RegExp(`at least ${PASSWORD_MIN_LENGTH} characters`, 'i'));
  });

  test('// reset-password should accept a password of exactly the minimum length', async () => {
    const user = { ...mockUser, save: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const res = await request(app)
      .post('/api/auth/reset-password/validtoken')
      .send({ newPassword: 'a'.repeat(PASSWORD_MIN_LENGTH) });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successful/i);
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