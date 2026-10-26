const express = require('express');
const controller = require('./admin.controller');
const rules = require('./admin.validation');
const paymentRules = require('../payments/payments.validation');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { requireAdmin } = require('../../middleware/authorize');

const router = express.Router();

// EVERY admin route: authenticated + admin role, enforced server-side.
router.use(authenticate, requireAdmin);

router.get('/dashboard', controller.dashboard);

// Customer management
router.get('/customers', controller.listCustomers);
router.get('/customers/:id', controller.customerDetail);
router.patch('/customers/:id/status', rules.customerStatusRules, validate, controller.setCustomerStatus);

// Order management
router.get('/orders', controller.listOrders);
router.put('/orders/:id/status', rules.orderStatusRules, validate, controller.updateOrderStatus);

// Payment records
router.get('/payments', paymentRules.listFilterRules, validate, controller.listPayments);
router.get('/payments/:id', controller.paymentDetail);

// Feedback moderation
router.get('/feedback', controller.listFeedback);
router.delete('/feedback/:id', controller.deleteFeedback);

// Contact request management
router.get('/contact-requests', controller.listContacts);
router.patch('/contact-requests/:id/resolve', controller.resolveContact);
router.delete('/contact-requests/:id', controller.deleteContact);

module.exports = router;
