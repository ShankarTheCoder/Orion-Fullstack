// Payment records logic. V1 has NO live gateway (PRD marks it Proposed):
// checkout creates the Payment record - COD stays 'pending-collection' until
// delivery, card/UPI are recorded 'paid' through this mock verify step.
const Payment = require('../../models/Payment.model');
const Order = require('../../models/Order.model');
const ApiError = require('../../utils/ApiError');

async function myPayments(userId, { page, limit, skip }) {
  const filter = { user: userId };
  const [items, total] = await Promise.all([
    Payment.find(filter).populate('order', 'orderNumber total status').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);
  return { items, total };
}

// Mock gateway verification: marks a card/UPI payment as paid and mirrors the
// status onto its order. COD payments cannot be "verified" online.
async function verifyMockPayment(user, paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment || String(payment.user) !== String(user._id)) throw new ApiError(404, 'Payment not found');
  if (payment.method === 'cod') throw new ApiError(400, 'Cash on Delivery payments are collected at delivery, not online');
  if (payment.status === 'paid') return payment;
  payment.status = 'paid';
  payment.gatewayPaymentId = payment.gatewayPaymentId || `mock_pay_${payment._id}`;
  await payment.save();
  await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'paid' });
  return payment;
}

async function listPaymentsAdmin(query, { page, limit, skip }) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('order', 'orderNumber total status')
      .populate('user', 'name email')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);
  return { items, total };
}

async function getPaymentAdmin(id) {
  const payment = await Payment.findById(id)
    .populate('order', 'orderNumber total status items')
    .populate('user', 'name email mobile');
  if (!payment) throw new ApiError(404, 'Payment not found');
  return payment;
}

module.exports = { myPayments, verifyMockPayment, listPaymentsAdmin, getPaymentAdmin };
