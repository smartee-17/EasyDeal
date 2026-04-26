import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';

let productId;

beforeAll(async () => {
  const uri = process.env.MONGO_TEST_URI;
  if (!uri) throw new Error('MONGO_TEST_URI is not defined');
  await mongoose.connect(uri);
});

afterAll(async () => {
  if (productId) {
    await request(app).delete(`/api/products/${productId}`);
  }
  await mongoose.connection.close();
});

describe('Product Routes', () => {
  it('POST /api/products - should create a product', async () => {
    const res = await request(app)
      .post('/api/products')
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
      .send({ price: 120.0 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Stealth Pro TKL Keyboard');
    expect(res.body.data.price).toBe(120.0);
  }, 10000);

  it('DELETE /api/products/:id - should delete a product', async () => {
    const res = await request(app).delete(`/api/products/${productId}`);
    expect(res.statusCode).toBe(200);

    const check = await request(app).get(`/api/products/${productId}`);
    expect(check.statusCode).toBe(404);
    productId = null;
  }, 10000);
});
