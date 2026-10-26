const Category = require('../../models/Category.model');
const Product = require('../../models/Product.model');
const ApiError = require('../../utils/ApiError');
const { slugify } = require('./categories.validation');

async function listCategories({ activeOnly = true } = {}) {
  const filter = activeOnly ? { isActive: true } : {};
  return Category.find(filter).sort({ name: 1 });
}

async function getCategory(id) {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
}

async function createCategory({ name, description, imageUrl }) {
  return Category.create({ name, slug: slugify(name), description: description || '', imageUrl: imageUrl || '' });
}

async function updateCategory(id, payload) {
  const category = await getCategory(id);
  if (payload.name && payload.name !== category.name) {
    category.name = payload.name;
    category.slug = slugify(payload.name);
  }
  if (payload.description !== undefined) category.description = payload.description;
  if (payload.imageUrl !== undefined) category.imageUrl = payload.imageUrl;
  if (payload.isActive !== undefined) category.isActive = payload.isActive;
  await category.save();
  return category;
}

// Deactivate instead of hard-delete when products still reference the
// category, so product history is never orphaned.
async function deleteCategory(id) {
  const category = await getCategory(id);
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    category.isActive = false;
    await category.save();
    return { deactivated: true, productCount };
  }
  await category.deleteOne();
  return { deactivated: false, productCount: 0 };
}

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
