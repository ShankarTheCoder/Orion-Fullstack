const mongoose = require('mongoose');

// payments collection (PDF Section 4): payment method, transaction reference
// and payment status. V1 uses a mock gateway (the PRD marks a live gateway
// as Proposed) - COD records are 'pending-collection' until delivery, and
// card/UPI records are recorded as 'paid' through the mock verify step.
const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['cod', 'card', 'upi'], required: true },
    gateway: { type: String, default: 'mock' },
    gatewayOrderId: { type: String, index: true },
    gatewayPaymentId: { type: String, index: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'pending-collection', 'refunded'],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
