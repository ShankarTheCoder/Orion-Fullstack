const express = require('express');
const controller = require('./users.controller');
const rules = require('./users.validation');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');

const router = express.Router();

// Any authenticated account (customer or admin) manages its OWN profile here.
// Admin management of OTHER customers lives in the admin module.
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, rules.updateProfileRules, validate, controller.updateProfile);

module.exports = router;
