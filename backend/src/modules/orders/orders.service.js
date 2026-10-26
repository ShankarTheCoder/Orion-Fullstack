// Order business logic (ported from the proven farm-picked-backend build):
// - Totals are ALWAYS recalculated from DB prices; client totals are ignored.
// - Stock is validated BEFORE any write, then decremented exactly once.
// - Cancelling (only from Placed/Confirmed) restores stock exactly once.
// - Lifecycle transitions are enforced via STATUS_FLOW in the Order model.
const Order = require('../../models/Order.model');
const { STATUS_FLOW } = require('../../models/Order.model');
const Product = require('../../models/Product.model');
const Cart = require('../../models/Cart.model');
const Address = require('../../models/Address.model');
const Payment = require('../../models/Payment.model');
const ApiError = require('../../utils/ApiError');
const { calcTotals } = require('../../utils/pricing');

async function nextOrderNumber() {
  const count = await Order.countDocuments();
  return `FP${1001 + count}`;
}

async function placeOrder(user, body) {
  const { addressId, address, deliveryDate, slotWindow, paymentMethod } = body;
  const method = String(paymentMethod || '').toLowerCase();

  let rawItems = body.items;
  if (!rawItems || !rawItems.length) {
    const cart = await Cart.findOne({ user: user._id });
    if (!cart || !cart.items.length) throw new ApiError(400, 'No items to order: cart is empty');
    rawItems = cart.items.map((i) => ({ productId: i.product, quantity: i.quantity }));
  }

  let addressSnapshot;
  if (addressId) {
    const addr = await Address.findById(addressId);
    if (!addr || String(addr.user) !== String(user._id)) throw new ApiError(404, 'Address not found');
    addressSnapshot = { fullName: addr.fullName, mobile: addr.mobile, line: addr.line, area: addr.area, city: addr.city, pincode: addr.pincode, label: addr.label };
  } else if (address) {
    addressSnapshot = address;
  } else {
    throw new ApiError(400, 'An addressId or address is required');
  }

  // Re-price from DB and validate stock BEFORE writing anything.
  const lines = [];
  let subtotal = 0;
  for (const raw of rawItems) {
    const product = await Product.findById(raw.productId || raw.product);
    if (!product || !product.isActive) throw new ApiError(400, `Product not available: ${raw.productId || raw.product}`);
    const qty = Number(raw.quantity);
    if (!qty || qty < 1) throw new ApiError(400, `Invalid quantity for ${product.name}`);
    if (qty > product.stock) throw new ApiError(400, `Insufficient stock for ${product.name}: ${product.stock} ${product.unit} available`);
    lines.push({ product, qty });
    subtotal += product.price * qty;
  }

  const { deliveryCharge, total } = calcTotals(subtotal);

  const order = await Order.create({
    orderNumber: await nextOrderNumber(),
    user: user._id,
    items: lines.map(({ product, qty }) => ({ product: product._id, name: product.name, price: product.price, unit: product.unit, quantity: qty })),
    subtotal, deliveryCharge, total,
    address: addressSnapshot,
    deliveryDate,
    slotWindow,
    paymentMethod: method,
    // COD is collected at the door; card/UPI are recorded as paid via the
    // mock gateway at checkout (no live gateway in V1 - PRD "Proposed").
    paymentStatus: method === 'cod' ? 'pending-collection' : 'paid',
    status: 'Placed',
    statusHistory: [{ status: 'Placed' }],
  });

  await Payment.create({
    order: order._id, user: user._id, method, gateway: 'mock',
    gatewayOrderId: `mock_order_${order._id}`,
    gatewayPaymentId: method === 'cod' ? undefined : `mock_pay_${order._id}`,
    amount: total,
    status: method === 'cod' ? 'pending-collection' : 'paid',
  });

  for (const { product, qty } of lines) {
    product.stock -= qty;
    await product.save();
  }
  await Cart.findOneAndUpdate({ user: user._id }, { items: [] });

  return Order.findById(order._id);
}

async function myOrders(userId, { page, limit, skip }) {
  const filter = { user: userId };
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return { items, total };
}

async function getOrderForUser(user, id) {
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (user.role !== 'admin' && String(order.user) !== String(user._id)) {
    throw new ApiError(404, 'Order not found'); // do not leak other customers' orders
  }
  return order;
}

async function cancelOrderDoc(order) {
  if (!['Placed', 'Confirmed'].includes(order.status)) {
    throw new ApiError(400, `Order in status ${order.status} cannot be cancelled`);
  }
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
  order.status = 'Cancelled';
  order.statusHistory.push({ status: 'Cancelled' });
  if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
  await order.save();
  await Payment.findOneAndUpdate(
    { order: order._id },
    { status: order.paymentStatus === 'refunded' ? 'refunded' : 'failed' }
  );
  return order;
}

async function cancelOrder(user, id) {
  const order = await getOrderForUser(user, id);
  return cancelOrderDoc(order);
}

// Admin: move an order along the lifecycle (STATUS_FLOW enforced).
async function updateStatusAdmin(id, status) {
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, 'Order not found');
  const allowed = STATUS_FLOW[order.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Invalid status change: ${order.status} -> ${status}. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`);
  }
  if (status === 'Cancelled') return cancelOrderDoc(order);
  order.status = status;
  order.statusHistory.push({ status });
  if (status === 'Delivered' && order.paymentMethod === 'cod') {
    order.paymentStatus = 'paid'; // cash collected on delivery
    await Payment.findOneAndUpdate({ order: order._id }, { status: 'paid' });
  }
  await order.save();
  return order;
}

async function listOrdersAdmin(query, { page, limit, skip }) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.date) filter.deliveryDate = query.date;
  if (query.search) filter.orderNumber = { $regex: query.search, $options: 'i' };
  const [items, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email mobile').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return { items, total };
}

module.exports = { placeOrder, myOrders, getOrderForUser, cancelOrder, cancelOrderDoc, updateStatusAdmin, listOrdersAdmin };
