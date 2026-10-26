const { body } = require('express-validator');
const { DEAL_FLAGS } = require('../../models/Product.model');

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a number >= 0'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be an integer >= 0'),
  body('category').optional().isString(),
  body('categoryId').optional().isString(),
  body('categoryName').optional().isString(),
  body('emoji').optional().isString(),
  body('imageUrl').optional().isString(),
  body('description').optional().isString(),
  body('dealFlags').optional().isArray().withMessage('dealFlags must be an array'),
  body('dealFlags.*').optional().isIn(DEAL_FLAGS).withMessage('Unknown deal flag'),
  body('isActive').optional().isBoolean(),
];

const stockRules = [
  body('stock').isInt({ min: 0 }).withMessage('Stock must be an integer >= 0'),
];

module.exports = { productRules, stockRules };
