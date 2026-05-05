import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';

let productId;
let authToken;

beforeAll(async () => {
  const uri = process.env.MONGO_TEST_URI;
  if (!uri) throw new Error('MONGO_TEST_URI is not defined');
  await mongoose.connect(uri);

  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    phone: '1234567890',
    username: 'testuser',
  });

  // const loginRes = await request(app).post('/api/auth/login').send({
  //   email: 'test@example.com',
  //   password: 'password123',
  // });
  authToken = registerRes.body.data?.token ?? registerRes.body.token;
});

afterAll(async () => {
  if (productId) {
    await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);
  }
  await mongoose.connection
    .collection('users')
    .deleteMany({ email: 'test@example.com' });
  await mongoose.connection.close();
});

describe('Product Routes', () => {
  it('POST /api/products - should create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Stealth Pro TKL Keyboard',
        description: 'Ultra-compact Tenkeyless TKL design.',
        price: 124.99,
        category: 'Peripherals',
        images: [
          'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae',
        ],
        isAvailable: true,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Stealth Pro TKL Keyboard');
    expect(res.body.data.price).toBe(124.99);
    expect(res.body.data._id).toBeDefined();
    productId = res.body.data._id;
  }, 10000);

  it('GET /api/products - should return all products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  }, 10000);

  it('GET /api/products/:id - should return a single product', async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(productId);
  }, 10000);

  it('PUT /api/products/:id - should update a product', async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ price: 120.0 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Stealth Pro TKL Keyboard');
    expect(res.body.data.price).toBe(120.0);
  }, 10000);

  it('DELETE /api/products/:id - should delete a product', async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    const check = await request(app).get(`/api/products/${productId}`);
    expect(check.statusCode).toBe(404);
    productId = null;
  }, 10000);
});
