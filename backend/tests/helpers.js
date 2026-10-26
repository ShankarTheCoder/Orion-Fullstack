const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = '<redacted>';
process.env.JWT_EXPIRES_IN = '24h';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
process.env.API_RATE_LIMIT_MAX = '100000';
// Deliberately NO RESEND_API_KEY: tests run the email service in DEV MODE,
// where OTPs are recorded in sendEmail.sentEmails for the suite to read.

let mongod;

async function setupTestDB() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('farm_picked_test');
  process.env.MONGODB_URI = uri; // seed script + config/env read this
  await mongoose.connect(uri);
}

async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) await collections[key].deleteMany();
}

async function teardownTestDB() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

// Test-local fixtures. The production seed creates ONLY the env admin and
// no data at all, so the suites build everything they need right here,
// directly through the models — small, deterministic, and unrelated to any
// demo dataset: 1 admin + 4 customers, 2 categories, 4 products, 1 address
// per main customer, 4 orders (with payments) and 3 feedback entries.
const FIXTURE_PASSWORDS = { admin: 'TestAdmin@123', customer: 'TestCust@123' };

async function createFixtures() {
  const User = require('../src/models/User.model');
  const Category = require('../src/models/Category.model');
  const Product = require('../src/models/Product.model');
  const Order = require('../src/models/Order.model');
  const Payment = require('../src/models/Payment.model');
  const Feedback = require('../src/models/Feedback.model');
  const Address = require('../src/models/Address.model');
  const { calcTotals } = require('../src/utils/pricing');

  const verified = { isEmailVerified: true };
  const mkUser = async (name, mobile, email, role, password) => User.create({
    name, mobile, email, role, ...verified,
    passwordHash: await User.hashPassword(password),
  });
  const admin = await mkUser('Test Admin', '9000000000', 'admin@test.local', 'admin', FIXTURE_PASSWORDS.admin);
  const customer = await mkUser('Test Customer', '9000000001', 'customer@test.local', 'customer', FIXTURE_PASSWORDS.customer);
  const priya = await mkUser('Priya Fixture', '9000000002', 'priya@test.local', 'customer', FIXTURE_PASSWORDS.customer);
  const rahul = await mkUser('Rahul Fixture', '9000000003', 'rahul@test.local', 'customer', FIXTURE_PASSWORDS.customer);
  const sneha = await mkUser('Sneha Fixture', '9000000004', 'sneha@test.local', 'customer', FIXTURE_PASSWORDS.customer);

  const fruits = await Category.create({ name: 'Fruits', slug: 'fruits', description: 'Fresh seasonal fruits' });
  const vegetables = await Category.create({ name: 'Vegetables', slug: 'vegetables', description: 'Farm-fresh vegetables' });

  const [tomato, potato, banana, mango] = await Product.create([
    { name: 'Desi Tomato', category: vegetables._id, price: 30, unit: 'kg', emoji: '🍅', stock: 150, dealFlags: ['rs30Corner'], description: 'Tangy desi tomatoes for curries and salads.' },
    { name: 'Potato (Aloo)', category: vegetables._id, price: 28, unit: 'kg', emoji: '🥔', stock: 300, dealFlags: ['rs30Corner', 'bigPack'], description: 'UP potatoes, all-purpose.' },
    { name: 'Banana Robusta', category: fruits._id, price: 60, unit: 'dozen', emoji: '🍌', stock: 120, dealFlags: [], description: 'Fresh robusta bananas, rich in potassium.' },
    { name: 'Alphonso Mango', category: fruits._id, price: 450, unit: 'kg', emoji: '🥭', stock: 60, dealFlags: ['dealOfWeek'], description: 'Ratnagiri Alphonso, the king of mangoes.' },
  ]);

  const address = await Address.create({
    user: customer._id, fullName: 'Test Customer', mobile: '9000000001',
    line: '12, Test Nagar', area: 'Test Nagar', city: 'Meerut', pincode: '250004', label: 'home',
  });
  const address2 = await Address.create({
    user: priya._id, fullName: 'Priya Fixture', mobile: '9000000002',
    line: '45, Abu Lane', area: 'Cantt', city: 'Meerut', pincode: '250001', label: 'home',
  });

  const today = new Date().toISOString().slice(0, 10);
  let seq = 1000;
  async function fixtureOrder(user, addr, picks, status, method, window) {
    seq += 1;
    const items = picks.map(([p, qty]) => ({ product: p._id, name: p.name, price: p.price, unit: p.unit, quantity: qty }));
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const { deliveryCharge, total } = calcTotals(subtotal);
    const order = await Order.create({
      orderNumber: `FP${seq}`,
      user: user._id, items, subtotal, deliveryCharge, total,
      address: { fullName: addr.fullName, mobile: addr.mobile, line: addr.line, area: addr.area, city: addr.city, pincode: addr.pincode, label: addr.label },
      deliveryDate: today, slotWindow: window,
      paymentMethod: method,
      paymentStatus: method === 'cod' ? 'pending-collection' : 'paid',
      status, statusHistory: [{ status: 'Placed' }, ...(status !== 'Placed' ? [{ status }] : [])],
    });
    await Payment.create({
      order: order._id, user: user._id, method, gateway: 'mock',
      gatewayOrderId: `mock_order_${order._id}`,
      gatewayPaymentId: method === 'cod' ? undefined : `mock_pay_${order._id}`,
      amount: total,
      status: method === 'cod' ? 'pending-collection' : 'paid',
    });
    for (const i of items) await Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.quantity } });
    return order;
  }

  const orders = [
    await fixtureOrder(customer, address, [[banana, 2], [potato, 1]], 'Placed', 'cod', '5-8 PM'),
    await fixtureOrder(customer, address, [[mango, 1]], 'Confirmed', 'card', '7-10 AM'),
    await fixtureOrder(priya, address2, [[potato, 3], [banana, 1]], 'Delivered', 'upi', '12-3 PM'),
    await fixtureOrder(priya, address2, [[tomato, 2]], 'Out for Delivery', 'cod', '5-8 PM'),
  ];

  await Feedback.create([
    { name: 'Test Customer', phone: '9000000001', comment: 'Mangoes were very fresh, delivery was on time!', rating: 5, user: customer._id, product: mango._id },
    { name: 'Priya Fixture', phone: '9000000002', comment: 'Good quality vegetables. Please add more leafy greens.', rating: 4, user: priya._id },
    { name: 'Rahul Fixture', phone: '9000000003', comment: 'Great value for daily sabzi.', rating: 5, user: rahul._id },
  ]);

  return {
    admin, customer, priya, rahul, sneha,
    categories: { fruits, vegetables },
    products: { tomato, potato, banana, mango },
    orders, address,
  };
}

module.exports = { setupTestDB, clearDB, teardownTestDB, createFixtures, FIXTURE_PASSWORDS };
