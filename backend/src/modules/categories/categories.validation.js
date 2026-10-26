const { body } = require('express-validator');

const slugify = (name) => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const categoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
  body('imageUrl').optional().isString(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

module.exports = { categoryRules, slugify };
