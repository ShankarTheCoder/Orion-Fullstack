// Product catalogue logic. Public reads are used by the User (guest) module;
// writes are admin-only (enforced in the routes by authorize middleware).
const Product = require('../../models/Product.model');
const Category = require('../../models/Category.model');
const ApiError = require('../../utils/ApiError');
const { deleteLocalImage } = require('../../utils/imageStorage');

async function resolveCategoryId(payload) {
  if (payload.categoryId) {
    const cat = await Category.findById(payload.categoryId);
    if (!cat) throw new ApiError(400, 'Category not found');
    return cat._id;
  }
  const name = payload.categoryName || payload.category;
  if (name) {
    if (/^[a-f\d]{24}$/i.test(name)) {
      const cat = await Category.findById(name);
      if (!cat) throw new ApiError(400, 'Category not found');
      return cat._id;
    }
    const cat = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (!cat) throw new ApiError(400, `Category not found: ${name}`);
    return cat._id;
  }
  throw new ApiError(400, 'A category (categoryId or category name) is required');
}

// Deal pseudo-categories used by the storefront sections.
function dealFilter(deal) {
  switch (deal) {
    case 'rs30Corner': return { price: { $lte: 30 } };
    case 'under30': return { price: { $lte: 30 } };
    case 'dealOfWeek': return { dealFlags: 'dealOfWeek' };
    case 'bigPack': return { dealFlags: 'bigPack' };
    case 'combo': return { dealFlags: 'combo' };
    case 'deal': return { dealFlags: 'deal' };
    default: return null;
  }
}

async function listProducts(query, { page, limit, skip }) {
  const filter = {};
  const includeInactive = query.all === 'true'; // routes restrict this to admins
  if (!includeInactive) filter.isActive = true;

  if (query.category) {
    if (/^[a-f\d]{24}$/i.test(query.category)) {
      filter.category = query.category;
    } else {
      const cat = await Category.findOne({ name: new RegExp(`^${query.category}$`, 'i') });
      filter.category = cat ? cat._id : { $in: [] }; // unknown name -> empty list
    }
  }
  if (query.deal) Object.assign(filter, dealFilter(query.deal) || {});
  if (query.search) filter.name = { $regex: query.search, $options: 'i' };

  const sortMap = {
    'price-asc': { price: 1 }, 'price-desc': { price: -1 },
    name: { name: 1 }, newest: { createdAt: -1 },
  };
  const sort = sortMap[query.sort] || { createdAt: 1 };

  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  return { items, total };
}

async function getProduct(id) {
  const product = await Product.findById(id).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

async function createProduct(payload) {
  const category = await resolveCategoryId(payload);
  const product = await Product.create({
    name: payload.name, category, price: payload.price, unit: payload.unit,
    stock: payload.stock ?? 0, emoji: payload.emoji || '', imageUrl: payload.imageUrl || '',
    description: payload.description || '', dealFlags: payload.dealFlags || [],
    isActive: payload.isActive !== false,
  });
  return getProduct(product._id);
}

async function updateProduct(id, payload) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  const previousImageUrl = product.imageUrl;
  if (payload.categoryId || payload.categoryName || payload.category) {
    product.category = await resolveCategoryId(payload);
  }
  for (const field of ['name', 'price', 'unit', 'stock', 'emoji', 'imageUrl', 'description', 'dealFlags', 'isActive']) {
    if (payload[field] !== undefined) product[field] = payload[field];
  }
  await product.save();
  // Replaced image: remove the old uploaded file (best effort).
  if (payload.imageUrl !== undefined && previousImageUrl && payload.imageUrl !== previousImageUrl) {
    deleteLocalImage(previousImageUrl);
  }
  return getProduct(id);
}

// Inventory/stock management (admin): set an absolute stock level.
async function updateStock(id, stock) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.stock = stock;
  await product.save();
  return getProduct(id);
}

// Deactivate (soft delete) so order history snapshots stay meaningful.
async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.isActive = false;
  await product.save();
  deleteLocalImage(product.imageUrl); // remove the uploaded file too (best effort)
  return product;
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, updateStock, deleteProduct, dealFilter };
