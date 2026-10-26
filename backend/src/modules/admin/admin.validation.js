const { body } = require('express-validator');
const { ORDER_STATUSES } = require('../../models/Order.model');

const orderStatusRules = [
  body('status').isIn(ORDER_STATUSES).withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
];

const customerStatusRules = [
  body('status').isIn(['active', 'blocked']).withMessage('status must be active or blocked'),
];

module.exports = { orderStatusRules, customerStatusRules };
