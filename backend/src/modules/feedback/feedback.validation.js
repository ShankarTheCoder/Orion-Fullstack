const { body } = require('express-validator');

const feedbackRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must be a 10-digit number'),
  body('comment').trim().notEmpty().withMessage('Comment is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('productId').optional().isString(),
  body('product').optional().isString(),
];

module.exports = { feedbackRules };
