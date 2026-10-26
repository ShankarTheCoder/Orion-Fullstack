const { body } = require('express-validator');
const { DELIVERY_WINDOWS } = require('../../utils/constants');

const placeOrderRules = [
  body('paymentMethod').isIn(['cod', 'card', 'upi']).withMessage('paymentMethod must be cod, card or upi'),
  body('deliveryDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('deliveryDate must be YYYY-MM-DD'),
  body('slotWindow').isIn(DELIVERY_WINDOWS).withMessage(`slotWindow must be one of: ${DELIVERY_WINDOWS.join(', ')}`),
  body('items').optional().isArray({ min: 1 }).withMessage('items must be a non-empty array when provided'),
  body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Item quantities must be at least 1'),
];

const statusRules = [
  body('status').notEmpty().withMessage('status is required'),
];

module.exports = { placeOrderRules, statusRules };
