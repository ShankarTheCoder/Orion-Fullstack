// Farm Picked backend — Jest + Supertest against mongodb-memory-server.
// The production seed creates ONLY the env admin and no data, so this suite
// builds its own fixtures (tests/helpers.js createFixtures: 1 admin,
// 4 customers, 2 categories, 4 products, 4 orders, 3 feedback) and then
// tests auth (+ email OTP via Resend dev mode), role guards, admin
// management, catalogue, cart, orders, payments, feedback and contact.
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { setupTestDB, teardownTestDB, createFixtures, FIXTURE_PASSWORDS } = require('./helpers');
const { sentEmails, clearSentEmails } = require('../src/utils/sendEmail');

let app;
let adminToken;
let customerToken;
let adminId;
let customerId;
let tomatoId;
let bananaId;
let potatoId;
let placedOrderId;

const ADMIN_EMAIL = 'admin@test.local';
const CUSTOMER_EMAIL = 'customer@test.local';
const CUSTOMER_PW = FIXTURE_PASSWORDS.customer;
const TEST_ADDRESS = { fullName: 'Test Customer', mobile: '9000000001', line: '12, Test Nagar', area: 'Test Nagar', city: 'Meerut', pincode: '250004', label: 'home' };

const api = () => request(app);
const asAdmin = (r) => r.set('Authorization', `Bearer ${adminToken}`);
const asCustomer = (r) => r.set('Authorization', `Bearer ${customerToken}`);

function lastOtpFor(email) {
  const mail = [...sentEmails].reverse().find((m) => m.to === email);
  return mail?.otp;
}

beforeAll(async () => {
  await setupTestDB();
  app = require('../src/app');
  const fixtures = await createFixtures();
  tomatoId = String(fixtures.products.tomato._id);
  bananaId = String(fixtures.products.banana._id);
  potatoId = String(fixtures.products.potato._id);

  const admin = await api().post('/api/v1/auth/admin/login').send({ email: ADMIN_EMAIL, password: FIXTURE_PASSWORDS.admin });
  adminToken = admin.body.token;
  adminId = admin.body.user.id;
  const customer = await api().post('/api/v1/auth/login').send({ email: CUSTOMER_EMAIL, password: CUSTOMER_PW });
  customerToken = customer.body.token;
  customerId = customer.body.user.id;
}, 240000);

afterAll(async () => {
  await teardownTestDB();
}, 60000);

describe('fixtures + health', () => {
  test('health endpoint responds', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('fixture accounts log in (created pre-verified by the test setup)', async () => {
    expect(adminToken).toBeTruthy();
    expect(customerToken).toBeTruthy();
    expect(adminId).toBeTruthy();
    expect(customerId).toBeTruthy();
  });

  test('wrong password is rejected with 401', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: CUSTOMER_EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('/me requires a token and returns the profile', async () => {
    expect((await api().get('/api/v1/auth/me')).status).toBe(401);
    const res = await asCustomer(api().get('/api/v1/auth/me'));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(CUSTOMER_EMAIL);
  });
});

describe('email OTP verification (Resend dev mode)', () => {
  const newUser = { name: 'OTP Tester', mobile: '9000000011', email: 'otp.tester@test.local', password: 'tester123' };

  test('register creates an UNVERIFIED user and sends an OTP (dev mode records it)', async () => {
    clearSentEmails();
    const res = await api().post('/api/v1/auth/register').send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.user.isEmailVerified).toBe(false);
    expect(res.body.token).toBeUndefined(); // no token before verification
    const otp = lastOtpFor(newUser.email);
    expect(otp).toMatch(/^\d{6}$/);
  });

  test('login is BLOCKED before verification with the not-verified error', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: newUser.email, password: newUser.password });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Email not verified/i);
  });

  test('wrong OTP is rejected', async () => {
    const real = lastOtpFor(newUser.email);
    const wrong = real === '000000' ? '111111' : '000000';
    const res = await api().post('/api/v1/auth/verify-email').send({ email: newUser.email, otp: wrong });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid OTP/i);
  });

  test('resend-otp inside 60s cooldown returns 429', async () => {
    const res = await api().post('/api/v1/auth/resend-otp').send({ email: newUser.email });
    expect(res.status).toBe(429);
  });

  test('correct OTP verifies the account and returns a JWT', async () => {
    const otp = lastOtpFor(newUser.email);
    const res = await api().post('/api/v1/auth/verify-email').send({ email: newUser.email, otp });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.isEmailVerified).toBe(true);
  });

  test('after verification, login succeeds', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: newUser.email, password: newUser.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('resend-otp invalidates the old OTP and issues a fresh one', async () => {
    const user2 = { name: 'Second Tester', mobile: '9000000012', email: 'otp.second@test.local', password: 'tester123' };
    await api().post('/api/v1/auth/register').send(user2);
    const firstOtp = lastOtpFor(user2.email);
    // Simulate the cooldown having passed by backdating last-sent in the DB.
    const User = require('../src/models/User.model');
    await User.updateOne({ email: user2.email }, { emailOtpLastSentAt: new Date(Date.now() - 61000) });
    const resend = await api().post('/api/v1/auth/resend-otp').send({ email: user2.email });
    expect(resend.status).toBe(200);
    const secondOtp = lastOtpFor(user2.email);
    expect(secondOtp).toMatch(/^\d{6}$/);
    if (secondOtp !== firstOtp) {
      const oldAttempt = await api().post('/api/v1/auth/verify-email').send({ email: user2.email, otp: firstOtp });
      expect(oldAttempt.status).toBe(400);
    }
    const ok = await api().post('/api/v1/auth/verify-email').send({ email: user2.email, otp: secondOtp });
    expect(ok.status).toBe(200);
  });

  test('expired OTP is rejected', async () => {
    const user3 = { name: 'Expiry Tester', mobile: '9000000013', email: 'otp.expiry@test.local', password: 'tester123' };
    await api().post('/api/v1/auth/register').send(user3);
    const otp = lastOtpFor(user3.email);
    const User = require('../src/models/User.model');
    await User.updateOne({ email: user3.email }, { emailOtpExpiresAt: new Date(Date.now() - 1000) });
    const res = await api().post('/api/v1/auth/verify-email').send({ email: user3.email, otp });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  test('register still validates input and rejects duplicates', async () => {
    const bad = await api().post('/api/v1/auth/register').send({ name: 'X', mobile: '123', email: 'bad', password: '1' });
    expect(bad.status).toBe(400);
    const dup = await api().post('/api/v1/auth/register').send(newUser);
    expect(dup.status).toBe(409);
  });
});

describe('catalogue (public)', () => {
  test('product list returns the 4 fixture products with pagination', async () => {
    const res = await api().get('/api/v1/products?limit=100');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    const tomato = res.body.items.find((p) => p.name === 'Desi Tomato');
    expect(String(tomato._id || tomato.id)).toBe(tomatoId);
    expect(tomato.price).toBe(30);
    expect(tomato.category).toBe('Vegetables');
  });

  test('search + category filter work', async () => {
    const search = await api().get('/api/v1/products?search=mango');
    expect(search.body.items.length).toBeGreaterThanOrEqual(1);
    expect(search.body.items.every((p) => /mango/i.test(p.name))).toBe(true);
    const fruits = await api().get('/api/v1/products?category=Fruits&limit=100');
    expect(fruits.body.total).toBe(2);
    const rs30 = await api().get('/api/v1/products?deal=rs30Corner&limit=100');
    expect(rs30.body.items.length).toBeGreaterThanOrEqual(1);
    expect(rs30.body.items.every((p) => p.price <= 30)).toBe(true);
  });

  test('categories list is public', async () => {
    const res = await api().get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.items.map((c) => c.name).sort()).toEqual(['Fruits', 'Vegetables']);
  });
});

describe('role guards', () => {
  test('guest gets 401 on cart, orders and profile', async () => {
    expect((await api().get('/api/v1/cart')).status).toBe(401);
    expect((await api().get('/api/v1/orders/my')).status).toBe(401);
    expect((await api().get('/api/v1/users/profile')).status).toBe(401);
    expect((await api().post('/api/v1/cart/items').send({ productId: tomatoId, quantity: 1 })).status).toBe(401);
  });

  test('customer gets 403 on admin routes and admin product writes', async () => {
    expect((await asCustomer(api().get('/api/v1/admin/dashboard'))).status).toBe(403);
    expect((await asCustomer(api().post('/api/v1/products')).send({ name: 'X', price: 10, unit: 'kg', categoryName: 'Fruits' })).status).toBe(403);
    expect((await asCustomer(api().get('/api/v1/admin/customers'))).status).toBe(403);
  });

  test('admin login path rejects a customer account', async () => {
    const res = await api().post('/api/v1/auth/admin/login').send({ email: CUSTOMER_EMAIL, password: CUSTOMER_PW });
    expect(res.status).toBe(403);
  });
});

describe('cart + orders (customer)', () => {
  test('cart add/update is re-priced from the DB', async () => {
    await asCustomer(api().delete('/api/v1/cart'));
    const add = await asCustomer(api().post('/api/v1/cart/items')).send({ productId: tomatoId, quantity: 2 });
    expect(add.status).toBe(200);
    expect(add.body.data.subtotal).toBe(60); // 2 x Rs 30 tomato
    expect(add.body.data.deliveryCharge).toBe(40);
    expect(add.body.data.total).toBe(100);
  });

  test('place order recalculates totals (client totals ignored), decrements stock', async () => {
    const before = await api().get(`/api/v1/products/${tomatoId}`);
    const stockBefore = before.body.data.stock;
    const res = await asCustomer(api().post('/api/v1/orders')).send({
      items: [{ productId: tomatoId, quantity: 2 }],
      address: TEST_ADDRESS,
      deliveryDate: new Date().toISOString().slice(0, 10),
      slotWindow: '5-8 PM',
      paymentMethod: 'cod',
      total: 1, // tampered client total - must be ignored
      subtotal: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(60);
    expect(res.body.data.deliveryCharge).toBe(40);
    expect(res.body.data.total).toBe(100);
    expect(res.body.data.paymentStatus).toBe('pending-collection');
    expect(res.body.data.orderNumber).toMatch(/^FP\d+$/);
    placedOrderId = res.body.data._id;
    const after = await api().get(`/api/v1/products/${tomatoId}`);
    expect(after.body.data.stock).toBe(stockBefore - 2);
  });

  test('free delivery above Rs 499', async () => {
    const mango = await api().get('/api/v1/products?search=Alphonso');
    const mangoId = mango.body.items[0]._id;
    const res = await asCustomer(api().post('/api/v1/orders')).send({
      items: [{ productId: mangoId, quantity: 2 }], // 2 x 450 = 900
      address: TEST_ADDRESS,
      deliveryDate: new Date().toISOString().slice(0, 10),
      slotWindow: '7-10 AM',
      paymentMethod: 'upi',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(900);
    expect(res.body.data.deliveryCharge).toBe(0);
    expect(res.body.data.paymentStatus).toBe('paid');
    // clean up: cancel restores stock; Confirmed-only rule does not apply to Placed
    const cancel = await asCustomer(api().put(`/api/v1/orders/${res.body.data._id}/cancel`));
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('Cancelled');
  });

  test('over-stock order is rejected and creates nothing', async () => {
    const res = await asCustomer(api().post('/api/v1/orders')).send({
      items: [{ productId: potatoId, quantity: 100000 }],
      address: TEST_ADDRESS,
      deliveryDate: new Date().toISOString().slice(0, 10),
      slotWindow: '5-8 PM',
      paymentMethod: 'cod',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/stock/i);
  });

  test('customers cannot see each other\'s orders', async () => {
    const priya = await api().post('/api/v1/auth/login').send({ email: 'priya@test.local', password: CUSTOMER_PW });
    expect(priya.status).toBe(200);
    const res = await request(app).get(`/api/v1/orders/${placedOrderId}`).set('Authorization', `Bearer ${priya.body.token}`);
    expect(res.status).toBe(404);
  });

  test('my orders lists the placed order; profile returns addresses + orderCount', async () => {
    const mine = await asCustomer(api().get('/api/v1/orders/my?limit=100'));
    expect(mine.body.items.some((o) => o._id === placedOrderId)).toBe(true);
    const profile = await asCustomer(api().get('/api/v1/users/profile'));
    expect(profile.status).toBe(200);
    expect(profile.body.data.addresses.length).toBeGreaterThanOrEqual(1);
    expect(profile.body.data.orderCount).toBeGreaterThanOrEqual(3);
  });

  test('addresses CRUD works for the owner', async () => {
    const create = await asCustomer(api().post('/api/v1/addresses')).send({
      fullName: 'Test Customer', mobile: '9000000001', line: '99, Test Lane', area: 'Civil Lines', city: 'Meerut', pincode: '250001', label: 'work',
    });
    expect(create.status).toBe(201);
    const id = create.body.data._id;
    const del = await asCustomer(api().delete(`/api/v1/addresses/${id}`));
    expect(del.status).toBe(200);
  });
});

describe('admin management', () => {
  test('dashboard returns sales statistics', async () => {
    const res = await asAdmin(api().get('/api/v1/admin/dashboard'));
    expect(res.status).toBe(200);
    expect(res.body.data.counts.products).toBe(4);
    expect(res.body.data.counts.customers).toBeGreaterThanOrEqual(4);
    expect(res.body.data.revenue).toBeGreaterThan(0);
    expect(res.body.data.ordersByStatus).toBeTruthy();
    expect(Array.isArray(res.body.data.topProducts)).toBe(true);
  });

  test('category CRUD (admin)', async () => {
    const create = await asAdmin(api().post('/api/v1/categories')).send({ name: 'Exotic', description: 'Imported specials' });
    expect(create.status).toBe(201);
    const id = create.body.data._id;
    const update = await asAdmin(api().put(`/api/v1/categories/${id}`)).send({ name: 'Exotic Fruits', description: 'Imported' });
    expect(update.status).toBe(200);
    expect(update.body.data.slug).toBe('exotic-fruits');
    const del = await asAdmin(api().delete(`/api/v1/categories/${id}`));
    expect(del.status).toBe(200);
  });

  test('product CRUD + stock management (admin)', async () => {
    const create = await asAdmin(api().post('/api/v1/products')).send({
      name: 'Dragon Fruit', price: 120, unit: 'piece', stock: 25, categoryName: 'Fruits', emoji: '🐉', description: 'Fresh dragon fruit',
    });
    expect(create.status).toBe(201);
    const id = create.body.data._id;
    const stock = await asAdmin(api().patch(`/api/v1/products/${id}/stock`)).send({ stock: 40 });
    expect(stock.status).toBe(200);
    expect(stock.body.data.stock).toBe(40);
    const pub = await api().get(`/api/v1/products/${id}`);
    expect(pub.body.data.name).toBe('Dragon Fruit');
    const del = await asAdmin(api().delete(`/api/v1/products/${id}`));
    expect(del.status).toBe(200);
    const after = await api().get('/api/v1/products?limit=100');
    expect(after.body.total).toBe(4); // deactivated products leave the public list
  });

  test('customer management: list, detail, block (blocked login fails), unblock', async () => {
    const list = await asAdmin(api().get('/api/v1/admin/customers?limit=100'));
    expect(list.status).toBe(200);
    const rahul = list.body.items.find((u) => u.email === 'rahul@test.local');
    expect(rahul).toBeTruthy();
    expect(rahul.passwordHash).toBeUndefined();

    const detail = await asAdmin(api().get(`/api/v1/admin/customers/${rahul._id || rahul.id}`));
    expect(detail.status).toBe(200);
    expect(detail.body.data.customer.email).toBe('rahul@test.local');

    const block = await asAdmin(api().patch(`/api/v1/admin/customers/${rahul._id || rahul.id}/status`)).send({ status: 'blocked' });
    expect(block.status).toBe(200);
    expect(block.body.data.status).toBe('blocked');

    const login = await api().post('/api/v1/auth/login').send({ email: 'rahul@test.local', password: CUSTOMER_PW });
    expect(login.status).toBe(403);
    expect(login.body.message).toMatch(/blocked/i);

    const unblock = await asAdmin(api().patch(`/api/v1/admin/customers/${rahul._id || rahul.id}/status`)).send({ status: 'active' });
    expect(unblock.status).toBe(200);
    const login2 = await api().post('/api/v1/auth/login').send({ email: 'rahul@test.local', password: CUSTOMER_PW });
    expect(login2.status).toBe(200);
  });

  test('admin cannot block their own account', async () => {
    const res = await asAdmin(api().patch(`/api/v1/admin/customers/${adminId}/status`)).send({ status: 'blocked' });
    // adminId is an admin, not a customer -> 404, and in any case never a self-block success
    expect([400, 404]).toContain(res.status);
    const me = await asAdmin(api().get('/api/v1/auth/me'));
    expect(me.body.data.status).toBe('active');
  });

  test('order management: lifecycle enforced (no skipping, cancel restores stock)', async () => {
    const list = await asAdmin(api().get('/api/v1/admin/orders?limit=100'));
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(4);

    // Placed -> Delivered directly must fail
    const skip = await asAdmin(api().put(`/api/v1/admin/orders/${placedOrderId}/status`)).send({ status: 'Delivered' });
    expect(skip.status).toBe(400);

    const confirm = await asAdmin(api().put(`/api/v1/admin/orders/${placedOrderId}/status`)).send({ status: 'Confirmed' });
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.status).toBe('Confirmed');

    // Customer can no longer cancel a Packed+ order, but Confirmed is still cancellable by admin flow:
    const stockBefore = (await api().get(`/api/v1/products/${tomatoId}`)).body.data.stock;
    const cancel = await asAdmin(api().put(`/api/v1/admin/orders/${placedOrderId}/status`)).send({ status: 'Cancelled' });
    expect(cancel.status).toBe(200);
    const stockAfter = (await api().get(`/api/v1/products/${tomatoId}`)).body.data.stock;
    expect(stockAfter).toBe(stockBefore + 2); // stock restored exactly once

    const cancelAgain = await asAdmin(api().put(`/api/v1/admin/orders/${placedOrderId}/status`)).send({ status: 'Cancelled' });
    expect(cancelAgain.status).toBe(400); // terminal
  });

  test('payment records: admin list + filter, customer my-payments', async () => {
    const list = await asAdmin(api().get('/api/v1/admin/payments?limit=100'));
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(4);
    const cod = await asAdmin(api().get('/api/v1/admin/payments?method=cod&limit=100'));
    expect(cod.body.items.every((p) => p.method === 'cod')).toBe(true);
    const mine = await asCustomer(api().get('/api/v1/payments/my'));
    expect(mine.status).toBe(200);
    expect(mine.body.items.length).toBeGreaterThanOrEqual(1);
  });

  test('feedback: public submit + list, admin delete', async () => {
    const submit = await api().post('/api/v1/feedback').send({
      name: 'Guest Reviewer', phone: '9811111111', comment: 'Great app!', rating: 5, productId: tomatoId,
    });
    expect(submit.status).toBe(201);
    const list = await asAdmin(api().get('/api/v1/admin/feedback?limit=100'));
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(4);
    const del = await asAdmin(api().delete(`/api/v1/admin/feedback/${submit.body.data._id}`));
    expect(del.status).toBe(200);
  });

  test('contact requests: public submit, admin resolve + delete', async () => {
    const submit = await api().post('/api/v1/contact').send({
      name: 'New Visitor', email: 'visitor@test.local', mobile: '9822222222', message: 'Do you deliver to Partapur?',
    });
    expect(submit.status).toBe(201);
    const id = submit.body.data._id;
    const list = await asAdmin(api().get('/api/v1/admin/contact-requests?status=open&limit=100'));
    expect(list.status).toBe(200);
    expect(list.body.items.some((c) => c._id === id)).toBe(true);
    const resolve = await asAdmin(api().patch(`/api/v1/admin/contact-requests/${id}/resolve`));
    expect(resolve.status).toBe(200);
    expect(resolve.body.data.status).toBe('resolved');
    const del = await asAdmin(api().delete(`/api/v1/admin/contact-requests/${id}`));
    expect(del.status).toBe(200);
  });

  test('change password works and old password stops working', async () => {
    const sneha = await api().post('/api/v1/auth/login').send({ email: 'sneha@test.local', password: CUSTOMER_PW });
    const token = sneha.body.token;
    const change = await request(app).put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: CUSTOMER_PW, newPassword: 'sneha-new-123' });
    expect(change.status).toBe(200);
    expect((await api().post('/api/v1/auth/login').send({ email: 'sneha@test.local', password: CUSTOMER_PW })).status).toBe(401);
    expect((await api().post('/api/v1/auth/login').send({ email: 'sneha@test.local', password: 'sneha-new-123' })).status).toBe(200);
  });
});
