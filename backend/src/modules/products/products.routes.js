const express = require('express');
const controller = require('./products.controller');
const rules = require('./products.validation');
const validate = require('../../middleware/validate');
const { authenticate, optionalAuth } = require('../../middleware/authenticate');
const { requireAdmin } = require('../../middleware/authorize');

const router = express.Router();

router.get('/', optionalAuth, controller.list); // public - User/Guest module
router.get('/:id', controller.detail); // public
router.post('/upload-image', authenticate, requireAdmin, controller.uploadImage); // admin image upload (multipart, max 5 MB)
router.post('/', authenticate, requireAdmin, rules.productRules, validate, controller.create);
router.put('/:id', authenticate, requireAdmin, rules.productRules, validate, controller.update);
router.patch('/:id/stock', authenticate, requireAdmin, rules.stockRules, validate, controller.updateStock);
router.delete('/:id', authenticate, requireAdmin, controller.remove);

module.exports = router;
