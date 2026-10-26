const mongoose = require('mongoose');

// products collection (PDF Section 4): name, description, price, images,
// category (reference) and stock quantity.
// API responses populate the category and also expose `category` as the
// category NAME string + `categoryId`, plus boolean deal helpers
// (dealOfWeek / bigPack / combo / under30) for the storefront sections.
const DEAL_FLAGS = ['deal', 'dealOfWeek', 'bigPack', 'combo', 'rs30Corner'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    unit: { type: String, required: [true, 'Unit is required'], default: 'kg' }, // kg | dozen | piece | bunch | litre
    emoji: { type: String, default: '' },
    imageUrl: { type: String, default: '' }, // Cloudinary/equivalent URL when uploaded (PDF stack table)
    description: { type: String, default: '' },
    stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
    dealFlags: [{ type: String, enum: DEAL_FLAGS }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);
productSchema.index({ name: 'text' });

productSchema.virtual('under30').get(function () { return this.price <= 30; });

productSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    if (ret.category && typeof ret.category === 'object') {
      ret.categoryId = ret.category._id;
      ret.category = ret.category.name;
    }
    ret.dealOfWeek = ret.dealFlags?.includes('dealOfWeek') || false;
    ret.bigPack = ret.dealFlags?.includes('bigPack') || false;
    ret.combo = ret.dealFlags?.includes('combo') || false;
    ret.under30 = doc.under30;
    return ret;
  },
});

module.exports = mongoose.model('Product', productSchema);
module.exports.DEAL_FLAGS = DEAL_FLAGS;
