const mongoose = require('mongoose');

// addresses collection (PDF Section 4): customer delivery addresses.
const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, match: [/^\d{10}$/, 'Mobile must be a 10-digit number'] },
    line: { type: String, required: true, trim: true },
    area: { type: String, default: '' },
    city: { type: String, default: 'Meerut' },
    pincode: { type: String, required: true, match: [/^\d{6}$/, 'Pincode must be 6 digits'] },
    label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema);
