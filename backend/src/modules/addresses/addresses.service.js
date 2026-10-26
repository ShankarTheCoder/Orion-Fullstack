const Address = require('../../models/Address.model');
const ApiError = require('../../utils/ApiError');

async function listAddresses(userId) {
  return Address.find({ user: userId }).sort({ createdAt: 1 });
}

async function createAddress(userId, payload) {
  return Address.create({ ...payload, user: userId });
}

async function getOwnedAddress(userId, id) {
  const address = await Address.findById(id);
  if (!address || String(address.user) !== String(userId)) throw new ApiError(404, 'Address not found');
  return address;
}

async function updateAddress(userId, id, payload) {
  const address = await getOwnedAddress(userId, id);
  for (const field of ['fullName', 'mobile', 'line', 'area', 'city', 'pincode', 'label']) {
    if (payload[field] !== undefined) address[field] = payload[field];
  }
  await address.save();
  return address;
}

async function deleteAddress(userId, id) {
  const address = await getOwnedAddress(userId, id);
  await address.deleteOne();
  return { deleted: true };
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress, getOwnedAddress };
