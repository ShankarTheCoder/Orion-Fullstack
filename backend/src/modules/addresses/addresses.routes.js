const express = require('express');
const controller = require('./addresses.controller');
const rules = require('./addresses.validation');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { requireCustomer } = require('../../middleware/authorize');

const router = express.Router();
router.use(authenticate, requireCustomer);

router.get('/', controller.list);
router.post('/', rules.addressRules, validate, controller.create);
router.put('/:id', rules.addressRules, validate, controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
