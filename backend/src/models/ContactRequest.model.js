const mongoose = require('mongoose');

// contactrequests collection (PDF Section 4): support/contact submissions
// from the public Contact Us page, managed by Admin (open -> resolved).
const contactRequestSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: [true, 'Email is required'], lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Email is invalid'] },
    mobile: { type: String, required: [true, 'Mobile is required'], match: [/^\d{10}$/, 'Mobile must be a 10-digit number'] },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);
contactRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
