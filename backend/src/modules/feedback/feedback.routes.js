const express = require('express');
const controller = require('./feedback.controller');
const rules = require('./feedback.validation');
const validate = require('../../middleware/validate');
const { optionalAuth } = require('../../middleware/authenticate');

const router = express.Router();

// Public: anyone can read reviews and submit feedback; a valid token simply
// attaches the account to the submission (optionalAuth).
router.get('/', controller.list);
router.post('/', optionalAuth, rules.feedbackRules, validate, controller.submit);

module.exports = router;
