const mongoose = require('mongoose');

// carts collection (PDF Section 4): one active cart per CUSTOMER.
// Guests have no cart (PDF permission table: Manage cart = Customer only).
// Items reference live products and are re-priced from the DB on every read.
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
