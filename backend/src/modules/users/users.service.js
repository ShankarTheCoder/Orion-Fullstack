// Customer profile logic (PDF module table: Customer -> Users).
const User = require('../../models/User.model');
const Address = require('../../models/Address.model');
const Order = require('../../models/Order.model');
const ApiError = require('../../utils/ApiError');

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  const [addresses, orderCount] = await Promise.all([
    Address.find({ user: userId }).sort({ createdAt: 1 }),
    Order.countDocuments({ user: userId }),
  ]);
  return { user: user.toSafeJSON(), addresses, orderCount };
}

async function updateProfile(userId, { name, mobile }) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (mobile && mobile !== user.mobile) {
    const clash = await User.findOne({ mobile, _id: { $ne: userId } });
    if (clash) throw new ApiError(409, 'A record with this mobile already exists', [{ field: 'mobile', message: 'This mobile is already registered' }]);
  }
  if (name) user.name = name;
  if (mobile) user.mobile = mobile;
  await user.save();
  return user.toSafeJSON();
}

module.exports = { getProfile, updateProfile };
