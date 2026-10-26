const mongoose = require('mongoose');

// feedback collection (PDF Section 4): customer reviews and feedback.
// A review may be tied to a product and/or the submitting user; general
// feedback (from the public Feedback page) leaves product unset.
const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    phone: { type: String, required: [true, 'Phone is required'], match: [/^\d{10}$/, 'Phone must be a 10-digit number'] },
    comment: { type: String, required: [true, 'Comment is required'], trim: true },
    rating: { type: Number, min: 1, max: 5 },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
