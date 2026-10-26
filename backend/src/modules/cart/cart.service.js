// Cart logic - CUSTOMER ONLY (routes enforce it). Guests have no cart at all
// per the PDF permission table; they must register/login first.
// Items are re-priced from live product data on every read.
const Cart = require('../../models/Cart.model');
const Product = require('../../models/Product.model');
const ApiError = require('../../utils/ApiError');
const { calcTotals } = require('../../utils/pricing');

async function presentCart(cart) {
  if (!cart) return { items: [], subtotal: 0, deliveryCharge: 0, total: 0 };
  const items = [];
  let subtotal = 0;
  for (const item of cart.items) {
    const product = typeof item.product === 'object' && item.product?.name
      ? item.product
      : await Product.findById(item.product).populate('category', 'name slug');
    if (!product) continue;
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    items.push({
      product: product.toJSON(), productId: product._id,
      name: product.name, price: product.price, unit: product.unit,
      quantity: item.quantity, lineTotal,
    });
  }
  const totals = calcTotals(subtotal);
  return { id: cart._id, items, ...totals, grandTotal: totals.total };
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function getCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product', populate: { path: 'category', select: 'name slug' },
  });
  return presentCart(cart);
}

async function addItem(userId, productId, quantity = 1) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');
  if (quantity > product.stock) throw new ApiError(400, `Only ${product.stock} ${product.unit} of ${product.name} in stock`);
  const cart = await getOrCreateCart(userId);
  const line = cart.items.find((i) => String(i.product) === String(productId));
  if (line) {
    if (line.quantity + quantity > product.stock) throw new ApiError(400, `Only ${product.stock} ${product.unit} of ${product.name} in stock`);
    line.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  await cart.save();
  return getCart(userId);
}

async function updateItem(userId, productId, quantity) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (quantity > product.stock) throw new ApiError(400, `Only ${product.stock} ${product.unit} of ${product.name} in stock`);
  const cart = await getOrCreateCart(userId);
  const line = cart.items.find((i) => String(i.product) === String(productId));
  if (!line) throw new ApiError(404, 'Item not in cart');
  line.quantity = quantity;
  await cart.save();
  return getCart(userId);
}

async function removeItem(userId, productId) {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((i) => String(i.product) !== String(productId));
  await cart.save();
  return getCart(userId);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return getCart(userId);
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, presentCart };
