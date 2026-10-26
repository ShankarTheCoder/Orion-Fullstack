const express = require('express');
const controller = require('./payments.controller');
const rules = require('./payments.validation');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { requireCustomer } = require('../../middleware/authorize');

const router = express.Router();
router.use(authenticate, requireCustomer);

router.get('/my', controller.mine);
router.post('/verify', rules.verifyRules, validate, controller.verify);

module.exports = router;
