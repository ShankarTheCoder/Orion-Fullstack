const express = require('express');
const controller = require('./cart.controller');
const rules = require('./cart.validation');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { requireCustomer } = require('../../middleware/authorize');

const router = express.Router();

// Every cart route: authenticate (guest -> 401) + customer role (admin -> 403).
router.use(authenticate, requireCustomer);

router.get('/', controller.get);
router.post('/items', rules.addItemRules, validate, controller.add);
router.put('/items/:productId', rules.updateItemRules, validate, controller.update);
router.delete('/items/:productId', controller.remove);
router.delete('/', controller.clear);

module.exports = router;
