const express = require('express');
const controller = require('./orders.controller');
const rules = require('./orders.validation');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { requireCustomer } = require('../../middleware/authorize');

const router = express.Router();

router.get('/delivery-windows', controller.deliveryWindows); // public: checkout slot options
router.use(authenticate, requireCustomer); // ordering is a customer activity
router.post('/', rules.placeOrderRules, validate, controller.place);
router.get('/my', controller.mine);
router.get('/:id', controller.detail);
router.put('/:id/cancel', controller.cancel);

module.exports = router;
