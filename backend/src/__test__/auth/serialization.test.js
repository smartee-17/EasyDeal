import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../api/models/user.model.js';

// The real model is loaded (not automocked) so toPublic() is exercised for
// real. No database connection is made: toPublic() only needs a document.
describe('User public serialization', () => {
  const withSecrets = () =>
    new User({
      name: 'Serialization User',
      email: 'serialize@example.com',
      password: 'hashed-secret',
      phone: '08012345678',
      username: 'serialize_user',
      bio: 'A legitimate public profile field',
      whatsappNumber: '08099999999',
      role: 'user',
      emailVerificationToken: 'email-token-secret',
      emailVerificationTokenExpire: new Date(),
      resetPasswordToken: 'reset-token-secret',
      resetPasswordExpires: new Date(),
    });

  test('// should NOT expose the password hash', () => {
    expect(withSecrets().toPublic()).not.toHaveProperty('password');
  });

  test('// should NOT expose email verification token or its expiry', () => {
    const pub = withSecrets().toPublic();
    expect(pub).not.toHaveProperty('emailVerificationToken');
    expect(pub).not.toHaveProperty('emailVerificationTokenExpire');
  });

  test('// should NOT expose the reset password token', () => {
    expect(withSecrets().toPublic()).not.toHaveProperty('resetPasswordToken');
  });

  test('// should NOT expose resetPasswordExpires', () => {
    // Regression: the field is `resetPasswordExpires` (plural). An earlier
    // toPublic() deleted `resetPasswordExpire`, so the real expiry leaked
    // into every login, registration and /api/user/me response.
    const doc = withSecrets();
    expect(doc.toPublic()).not.toHaveProperty('resetPasswordExpires');
    // Guard against the misspelling being reintroduced on the schema.
    expect(doc.resetPasswordExpires).toBeInstanceOf(Date);
  });

  test('// should NOT expose any reset-password related field', () => {
    const pub = withSecrets().toPublic();
    const leaked = Object.keys(pub).filter((k) => /resetpassword/i.test(k));
    expect(leaked).toEqual([]);
  });

  test('// should NOT expose any token-like or secret-like field', () => {
    const pub = withSecrets().toPublic();
    const leaked = Object.keys(pub).filter(
      (k) => /token|password|secret/i.test(k),
    );
    expect(leaked).toEqual([]);
  });

  test('// should keep legitimate public profile fields', () => {
    const pub = withSecrets().toPublic();
    expect(pub.name).toBe('Serialization User');
    expect(pub.email).toBe('serialize@example.com');
    expect(pub.phone).toBe('08012345678');
    expect(pub.username).toBe('serialize_user');
    expect(pub.bio).toBe('A legitimate public profile field');
    expect(pub.role).toBe('user');
  });
});

// The auth tests automock the model; these assertions confirm the real schema
// fields the API contract depends on still exist under their exact names.
describe('User schema field names', () => {
  test('// schema uses resetPasswordExpires (not resetPasswordExpire)', () => {
    expect(User.schema.path('resetPasswordExpires')).toBeDefined();
  });

  test('// password carries an 8-character minimum', () => {
    expect(User.schema.path('password').options.minlength).toBe(8);
  });

  test('// a 7-character password fails model validation', async () => {
    const doc = new User({
      name: 'Short',
      email: 'short@example.com',
      password: 'a'.repeat(7),
      phone: '08012345678',
    });
    const err = doc.validateSync();
    expect(err?.errors?.password).toBeDefined();
  });

  test('// an 8-character password passes model validation', async () => {
    const doc = new User({
      name: 'Eight',
      email: 'eight@example.com',
      password: 'a'.repeat(8),
      phone: '08012345678',
    });
    const err = doc.validateSync();
    expect(err?.errors?.password).toBeUndefined();
  });
});

afterAll(async () => {
  await mongoose.disconnect().catch(() => {});
});