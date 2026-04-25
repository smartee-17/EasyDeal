import 'dotenv/config';
import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';

let productId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const res = await request(app).get('/api/products');
  productId = res.body.data[0]._id; // fix here
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Product Routes', () => {
  it('GET /api/products - should return all products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Object);
  }, 10000);

  it('GET /api/products/:id - should return a single product', async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.statusCode).toBe(200);
  }, 10000);

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
  }, 10000);

  it('PUT /api/products/:id - should update a product', async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .send({ price: '120.00' });
    expect(res.statusCode).toBe(200);
  }, 10000);

  it('DELETE /api/products/:id - should delete a product', async () => {
    const res = await request(app).delete(`/api/products/${productId}`);
    expect(res.statusCode).toBe(200);
  }, 10000);
});
