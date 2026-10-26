// Auth business logic: bcrypt hashing via the User model, JWT issuing, role
// rules - plus EMAIL OTP VERIFICATION via Resend:
//   register -> user created UNVERIFIED + 6-digit OTP emailed (hashed at rest)
//   verify-email -> OTP checked (expiry + max 5 attempts) -> JWT issued
//   resend-otp -> fresh OTP, 60-second cooldown, old OTP invalidated
//   login -> REJECTED until the email is verified.
// Registration always creates a customer (PDF Section 7); admin accounts are
// only created by seeding/direct DB access and are seeded verified.
const crypto = require('crypto');
const User = require('../../models/User.model');
const ApiError = require('../../utils/ApiError');
const { signToken } = require('../../utils/token');
const { sendOtpEmail } = require('../../utils/sendEmail');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function authResponse(user, status = 200) {
  return { status, body: { success: true, token: signToken(user), user: user.toSafeJSON() } };
}

async function issueOtp(user) {
  const otp = String(crypto.randomInt(100000, 1000000)); // 6 digits
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = new Date();
  await user.save();
  await sendOtpEmail(user.email, otp);
  return user;
}

async function register({ name, mobile, email, password }) {
  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile }] });
  if (existing) {
    const field = existing.email === normalizedEmail ? 'email' : 'mobile';
    throw new ApiError(409, `An account with this ${field} already exists`, [{ field, message: `This ${field} is already registered` }]);
  }
  const user = await User.create({
    name, mobile, email: normalizedEmail,
    passwordHash: await User.hashPassword(password),
    role: 'customer', // never admin via the public API
    isEmailVerified: false,
  });
  await issueOtp(user);
  // No token yet - the client must verify the OTP first.
  return {
    status: 201,
    body: {
      success: true,
      message: 'Registration successful. Please verify the OTP sent to your email.',
      user: user.toSafeJSON(),
    },
  };
}

async function verifyEmail(email, otp) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+emailOtpHash');
  if (!user) throw new ApiError(404, 'Account not found');
  if (user.isEmailVerified) throw new ApiError(400, 'Email is already verified. Please log in.');
  if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
    throw new ApiError(400, 'No OTP pending for this account. Please request a new one.');
  }
  if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, 'Too many incorrect OTP attempts. Please request a new OTP.');
  }
  if (user.emailOtpExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }
  if (hashOtp(otp) !== user.emailOtpHash) {
    user.emailOtpAttempts += 1;
    await user.save();
    const remaining = OTP_MAX_ATTEMPTS - user.emailOtpAttempts;
    throw new ApiError(400, `Invalid OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'No attempts remaining - please request a new OTP.'}`);
  }
  user.isEmailVerified = true;
  user.emailOtpHash = undefined;
  user.emailOtpExpiresAt = undefined;
  user.emailOtpAttempts = 0;
  await user.save();
  return authResponse(user);
}

async function resendOtp(email) {
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) throw new ApiError(404, 'Account not found');
  if (user.isEmailVerified) throw new ApiError(400, 'Email is already verified. Please log in.');
  if (user.emailOtpLastSentAt) {
    const elapsed = Date.now() - user.emailOtpLastSentAt.getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new ApiError(429, `Please wait ${wait} seconds before requesting a new OTP.`);
    }
  }
  await issueOtp(user); // fresh OTP - the old hash is overwritten/invalidated
  return { message: 'A new OTP has been sent to your email.' };
}

async function login(email, password, { adminOnly = false } = {}) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (adminOnly && user.role !== 'admin') {
    throw new ApiError(403, 'This is not an admin account');
  }
  if (user.status === 'blocked') {
    throw new ApiError(403, 'Your account has been blocked. Please contact support.');
  }
  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Email not verified. Please verify the OTP sent to your email.');
  }
  return authResponse(user);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
  return { message: 'Password changed successfully' };
}

module.exports = {
  register, login, changePassword, authResponse, verifyEmail, resendOtp,
  OTP_TTL_MS, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_MS,
};
