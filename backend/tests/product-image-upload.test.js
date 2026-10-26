// Product image upload — Jest + Supertest against mongodb-memory-server.
// Covers POST /api/v1/products/upload-image (admin, multipart, images only,
// max 5 MB), static serving of the stored file, and using the returned
// imageUrl on a product.
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { setupTestDB, teardownTestDB } = require('./helpers');

let app;
let adminToken;
let customerToken;
let imageUrl;

const api = () => request(app);
const asAdmin = (r) => r.set('Authorization', `Bearer ${adminToken}`);
const asCustomer = (r) => r.set('Authorization', `Bearer ${customerToken}`);

// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

beforeAll(async () => {
  await setupTestDB();
  app = require('../src/app');
  // Test-local fixtures (the production seed creates no data): one admin,
  // one customer and one category, created directly through the models.
  const User = require('../src/models/User.model');
  const Category = require('../src/models/Category.model');
  await User.create({
    name: 'Upload Admin', mobile: '9000000020', email: 'admin@test.local', role: 'admin',
    isEmailVerified: true, passwordHash: await User.hashPassword('TestAdmin@123'),
  });
  await User.create({
    name: 'Upload Customer', mobile: '9000000021', email: 'customer@test.local', role: 'customer',
    isEmailVerified: true, passwordHash: await User.hashPassword('TestCust@123'),
  });
  await Category.create({ name: 'Fruits', slug: 'fruits', description: 'Fresh seasonal fruits' });
  const admin = await api().post('/api/v1/auth/admin/login').send({ email: 'admin@test.local', password: 'TestAdmin@123' });
  adminToken = admin.body?.data?.token || admin.body?.token;
  const customer = await api().post('/api/v1/auth/login').send({ email: 'customer@test.local', password: 'TestCust@123' });
  customerToken = customer.body?.data?.token || customer.body?.token;
}, 240000);

afterAll(async () => {
  // Remove any files the suite uploaded, keep the folder/.gitkeep.
  if (imageUrl) {
    const f = path.join(__dirname, '..', 'uploads', imageUrl.replace('/uploads/', ''));
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
  await teardownTestDB();
}, 60000);

describe('product image upload', () => {
  test('admin uploads a valid PNG -> 200 with /uploads imageUrl, and the file serves back', async () => {
    const res = await asAdmin(api().post('/api/v1/products/upload-image'))
      .attach('image', PNG, { filename: 'test.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/products\/.+\.png$/);
    imageUrl = res.body.imageUrl;

    const got = await api().get(imageUrl);
    expect(got.status).toBe(200);
    expect(got.headers['content-type']).toMatch(/image\/png/);
  });

  test('upload over 5 MB is rejected with the size message', async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1024, 1);
    const res = await asAdmin(api().post('/api/v1/products/upload-image'))
      .attach('image', big, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/up to 5 MB/i);
  });

  test('non-image upload (.txt) is rejected with 400', async () => {
    const res = await asAdmin(api().post('/api/v1/products/upload-image'))
      .attach('image', Buffer.from('not an image'), { filename: 'note.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only image/i);
  });

  test('customer token cannot upload (403) and guests get 401', async () => {
    const asCust = await asCustomer(api().post('/api/v1/products/upload-image'))
      .attach('image', PNG, { filename: 'x.png', contentType: 'image/png' });
    expect(asCust.status).toBe(403);
    const guest = await api().post('/api/v1/products/upload-image')
      .attach('image', PNG, { filename: 'x.png', contentType: 'image/png' });
    expect(guest.status).toBe(401);
  });

  test('a product created with the uploaded imageUrl returns that image', async () => {
    const cats = await api().get('/api/v1/categories');
    const firstCat = (cats.body.data || cats.body.items || [])[0];
    const res = await asAdmin(api().post('/api/v1/products')).send({
      name: 'Upload Test Mango', categoryName: firstCat.name, price: 99, unit: 'kg', stock: 5, imageUrl,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.imageUrl).toBe(imageUrl);
    const detail = await api().get(`/api/v1/products/${res.body.data._id || res.body.data.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.imageUrl).toBe(imageUrl);
  });
});
