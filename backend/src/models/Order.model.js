const mongoose = require('mongoose');

const ORDER_STATUSES = ['Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
// Order lifecycle (PRD Section 13): forward moves only, plus Cancelled -
// and cancel is allowed ONLY from Placed/Confirmed.
const STATUS_FLOW = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Packed', 'Cancelled'],
  Packed: ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

// orders collection (PDF Section 4): order items, totals, delivery details
// and status. Items and delivery address are SNAPSHOTS embedded on the order,
// so a later product-price or address edit never rewrites a placed order.
const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true }, // e.g. FP1001
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        unit: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    address: {
      fullName: String, mobile: String, line: String, area: String,
      city: { type: String, default: 'Meerut' }, pincode: String, label: String,
    },
    deliveryDate: { type: String, required: true, index: true }, // YYYY-MM-DD
    slotWindow: { type: String, required: true }, // e.g. "5-8 PM"
    paymentMethod: { type: String, enum: ['cod', 'card', 'upi'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending-collection', 'pending', 'paid', 'failed', 'refunded'],
      required: true,
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'Placed', required: true, index: true },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.STATUS_FLOW = STATUS_FLOW;
