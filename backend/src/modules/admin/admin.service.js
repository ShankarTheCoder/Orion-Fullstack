// Admin management logic (PDF Admin module): dashboard + sales statistics,
// customer management, order management, payment records, feedback and
// contact-request moderation. Every route using this service sits behind
// authenticate + requireAdmin in admin.routes.js.
const User = require('../../models/User.model');
const Product = require('../../models/Product.model');
const Category = require('../../models/Category.model');
const Order = require('../../models/Order.model');
const Payment = require('../../models/Payment.model');
const Feedback = require('../../models/Feedback.model');
const ContactRequest = require('../../models/ContactRequest.model');
const Cart = require('../../models/Cart.model');
const Address = require('../../models/Address.model');
const ApiError = require('../../utils/ApiError');

async function dashboardStats() {
  const [products, categories, customers, orders, paymentsCount, feedbackCount, openContacts] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Order.find().select('total status items createdAt'),
    Payment.countDocuments(),
    Feedback.countDocuments(),
    ContactRequest.countDocuments({ status: 'open' }),
  ]);

  const revenueOrders = orders.filter((o) => o.status !== 'Cancelled');
  const revenue = revenueOrders.reduce((sum, o) => sum + o.total, 0);

  const ordersByStatus = {};
  for (const o of orders) ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;

  // Sales statistics: units + revenue per product (excluding cancelled).
  const perProduct = new Map();
  for (const order of revenueOrders) {
    for (const item of order.items) {
      const key = String(item.product);
      const row = perProduct.get(key) || { productId: item.product, name: item.name, unitsSold: 0, revenue: 0 };
      row.unitsSold += item.quantity;
      row.revenue += item.price * item.quantity;
      perProduct.set(key, row);
    }
  }
  const topProducts = [...perProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const lowStock = await Product.find({ isActive: true, stock: { $lte: 10 } })
    .select('name stock unit').sort({ stock: 1 }).limit(10);

  return {
    counts: {
      products, categories, customers,
      orders: orders.length,
      pendingOrders: ordersByStatus.Placed || 0,
      payments: paymentsCount, feedback: feedbackCount, openContactRequests: openContacts,
    },
    revenue, // sales total, cancelled orders excluded
    ordersByStatus,
    topProducts,
    lowStock,
  };
}

// ---- Customer management -------------------------------------------------
async function listCustomers(query, { page, limit, skip }) {
  const filter = { role: 'customer' };
  if (query.status) filter.status = query.status;
  if (query.verification === 'verified') filter.isEmailVerified = true;
  else if (query.verification === 'pending' || query.verification === 'unverified') filter.isEmailVerified = false;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { mobile: { $regex: query.search, $options: 'i' } },
    ];
  }
  const [docs, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  const items = await Promise.all(docs.map(async (u) => {
    const orderCount = await Order.countDocuments({ user: u._id });
    return { ...u.toSafeJSON(), orderCount };
  }));
  return { items, total };
}

async function getCustomerDetail(id) {
  const user = await User.findById(id);
  if (!user || user.role !== 'customer') throw new ApiError(404, 'Customer not found');
  const orders = await Order.find({ user: id }).sort({ createdAt: -1 }).limit(20);
  const totalSpent = orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);
  return { customer: user.toSafeJSON(), orders, totalSpent };
}

// The customer-management action is a STATUS TOGGLE (active <-> blocked),
// never a hard delete: customers with order history must keep their records,
// and an admin can never block/delete their own account.
async function setCustomerStatus(adminUser, customerId, status) {
  if (String(adminUser._id) === String(customerId)) {
    throw new ApiError(400, 'You cannot change the status of your own account');
  }
  const user = await User.findById(customerId);
  if (!user || user.role !== 'customer') throw new ApiError(404, 'Customer not found');
  user.status = status;
  await user.save();
  return user.toSafeJSON();
}

// Admin can verify or unverify customers directly from the Admin Panel
async function setCustomerVerification(adminUser, customerId, isVerified = true) {
  if (String(adminUser._id) === String(customerId)) {
    throw new ApiError(400, 'You cannot change the verification status of your own account');
  }
  const user = await User.findById(customerId);
  if (!user || user.role !== 'customer') throw new ApiError(404, 'Customer not found');
  user.isEmailVerified = Boolean(isVerified);
  await user.save();
  return user.toSafeJSON();
}

async function createCustomer({ name, mobile, email, password, status = 'active', isEmailVerified = true }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: mobile.trim() }] });
  if (existing) {
    if (existing.email === normalizedEmail) throw new ApiError(400, 'A customer with this email already exists');
    throw new ApiError(400, 'A customer with this mobile number already exists');
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    mobile: mobile.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'customer',
    status: status || 'active',
    isEmailVerified: isEmailVerified !== undefined ? Boolean(isEmailVerified) : true,
  });
  return user.toSafeJSON();
}

async function updateCustomer(adminUser, customerId, data) {
  if (String(adminUser._id) === String(customerId)) {
    throw new ApiError(400, 'Admins cannot edit their account through customer management');
  }
  const user = await User.findById(customerId);
  if (!user || user.role !== 'customer') throw new ApiError(404, 'Customer not found');

  if (data.email) {
    const normalizedEmail = data.email.toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: customerId } });
      if (emailExists) throw new ApiError(400, 'A customer with this email already exists');
      user.email = normalizedEmail;
    }
  }
  if (data.mobile) {
    const cleanMobile = data.mobile.trim();
    if (cleanMobile !== user.mobile) {
      const mobileExists = await User.findOne({ mobile: cleanMobile, _id: { $ne: customerId } });
      if (mobileExists) throw new ApiError(400, 'A customer with this mobile number already exists');
      user.mobile = cleanMobile;
    }
  }
  if (data.name) user.name = data.name.trim();
  if (data.status) user.status = data.status;
  if (data.isEmailVerified !== undefined) {
    user.isEmailVerified = Boolean(data.isEmailVerified);
  }
  if (data.password) {
    user.passwordHash = await User.hashPassword(data.password);
  }

  await user.save();
  return user.toSafeJSON();
}

async function deleteCustomer(adminUser, customerId) {
  if (String(adminUser._id) === String(customerId)) {
    throw new ApiError(400, 'You cannot delete your own admin account');
  }
  const user = await User.findById(customerId);
  if (!user || user.role !== 'customer') throw new ApiError(404, 'Customer not found');

  const orderCount = await Order.countDocuments({ user: customerId });
  if (orderCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete customer with existing order history (${orderCount} order(s)). To prevent login, please block the customer instead.`
    );
  }

  await Promise.all([
    User.findByIdAndDelete(customerId),
    Cart.deleteMany({ user: customerId }),
    Address.deleteMany({ user: customerId }),
  ]);

  return { message: 'Customer deleted successfully' };
}

module.exports = {
  dashboardStats, listCustomers, getCustomerDetail, setCustomerStatus, setCustomerVerification,
  createCustomer, updateCustomer, deleteCustomer,
  // re-exported model access for the admin controller's simple list endpoints
  models: { Payment, Feedback, ContactRequest },
};
