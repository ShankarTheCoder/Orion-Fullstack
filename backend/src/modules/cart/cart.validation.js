const { body } = require('express-validator');

const addItemRules = [
  body('productId').notEmpty().withMessage('productId is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const updateItemRules = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

module.exports = { addItemRules, updateItemRules };
