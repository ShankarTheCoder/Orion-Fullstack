const Feedback = require('../../models/Feedback.model');
const Product = require('../../models/Product.model');
const ApiError = require('../../utils/ApiError');

async function submitFeedback(user, payload) {
  const productId = payload.productId || payload.product;
  let product;
  if (productId) {
    product = await Product.findById(productId);
    if (!product) throw new ApiError(400, 'Product not found for this review');
  }
  return Feedback.create({
    name: payload.name, phone: payload.phone, comment: payload.comment,
    rating: payload.rating, product: product?._id,
    user: user?._id,
  });
}

// Public review list (product page / Feedback page), newest first.
async function listFeedback(query, { page, limit, skip }) {
  const filter = {};
  if (query.product || query.productId) filter.product = query.product || query.productId;
  const [items, total] = await Promise.all([
    Feedback.find(filter).populate('product', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Feedback.countDocuments(filter),
  ]);
  return { items, total };
}

async function deleteFeedback(id) {
  const feedback = await Feedback.findById(id);
  if (!feedback) throw new ApiError(404, 'Feedback not found');
  await feedback.deleteOne();
  return { deleted: true };
}

module.exports = { submitFeedback, listFeedback, deleteFeedback };
