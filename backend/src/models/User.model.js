const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// users collection (PDF Section 4): account credentials, profile basics and
// ONE role field (customer | admin) - a single User model serves both roles
// (PDF Section 7). Guests have NO account until they register.
// Customer-specific profile data (phone/address book links) lives here as
// profile basics + the addresses collection (PDF's "customerprofiles" data).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    mobile: {
      type: String, required: [true, 'Mobile is required'], unique: true,
      match: [/^\d{10}$/, 'Mobile must be a 10-digit number'],
    },
    email: {
      type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is invalid'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', required: true },
    // Admin customer-management switch: a blocked customer cannot log in and
    // their existing tokens are refused by the authenticate middleware.
    status: { type: String, enum: ['active', 'blocked'], default: 'active', required: true },
    // Email OTP verification (Resend). New registrations start unverified
    // and cannot log in until the OTP is confirmed. Seeded/admin-created
    // accounts are created with isEmailVerified: true.
    isEmailVerified: { type: Boolean, default: false },
    // Only the HASH of the 6-digit OTP is ever stored - never the plain code.
    emailOtpHash: { type: String, select: false },
    emailOtpExpiresAt: { type: Date },
    emailOtpAttempts: { type: Number, default: 0 },
    emailOtpLastSentAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 10);
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id, _id: this._id, name: this.name, mobile: this.mobile,
    email: this.email, role: this.role, status: this.status,
    isEmailVerified: this.isEmailVerified, createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
