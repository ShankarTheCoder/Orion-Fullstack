const express = require('express');
const controller = require('./categories.controller');
const rules = require('./categories.validation');
const validate = require('../../middleware/validate');
const { authenticate, optionalAuth } = require('../../middleware/authenticate');
const { requireAdmin } = require('../../middleware/authorize');

const router = express.Router();

router.get('/', optionalAuth, controller.list); // public
router.get('/:id', controller.detail); // public
router.post('/', authenticate, requireAdmin, rules.categoryRules, validate, controller.create);
router.put('/:id', authenticate, requireAdmin, rules.categoryRules, validate, controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.remove);

module.exports = router;
