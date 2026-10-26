const express = require('express');
const controller = require('./contact.controller');
const rules = require('./contact.validation');
const validate = require('../../middleware/validate');
const { optionalAuth } = require('../../middleware/authenticate');

const router = express.Router();

// Public submission from the Contact Us page (admin management lives in the
// admin module under /admin/contact-requests).
router.post('/', optionalAuth, rules.contactRules, validate, controller.submit);

module.exports = router;
