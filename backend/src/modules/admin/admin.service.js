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

module.exports = {
  dashboardStats, listCustomers, getCustomerDetail, setCustomerStatus,
  // re-exported model access for the admin controller's simple list endpoints
  models: { Payment, Feedback, ContactRequest },
};
