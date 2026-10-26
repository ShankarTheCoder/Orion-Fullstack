const { body, query } = require('express-validator');

// Payments are read-mostly in V1 (records are created by checkout). The only
// input validation needed is the mock verify payload + admin list filters.
const verifyRules = [
  body('paymentId').notEmpty().withMessage('paymentId is required'),
];

const listFilterRules = [
  query('status').optional().isIn(['created', 'paid', 'failed', 'pending-collection', 'refunded']),
  query('method').optional().isIn(['cod', 'card', 'upi']),
];

module.exports = { verifyRules, listFilterRules };
