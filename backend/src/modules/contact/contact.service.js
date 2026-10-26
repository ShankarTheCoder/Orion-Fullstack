const ContactRequest = require('../../models/ContactRequest.model');
const ApiError = require('../../utils/ApiError');

async function submitContact(user, payload) {
  return ContactRequest.create({
    name: payload.name || user?.name || '',
    email: payload.email, mobile: payload.mobile, message: payload.message,
    user: user?._id,
  });
}

async function listContactRequests(query, { page, limit, skip }) {
  const filter = {};
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    ContactRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactRequest.countDocuments(filter),
  ]);
  return { items, total };
}

async function resolveContactRequest(id) {
  const request = await ContactRequest.findById(id);
  if (!request) throw new ApiError(404, 'Contact request not found');
  request.status = 'resolved';
  request.resolvedAt = new Date();
  await request.save();
  return request;
}

async function deleteContactRequest(id) {
  const request = await ContactRequest.findById(id);
  if (!request) throw new ApiError(404, 'Contact request not found');
  await request.deleteOne();
  return { deleted: true };
}

module.exports = { submitContact, listContactRequests, resolveContactRequest, deleteContactRequest };
