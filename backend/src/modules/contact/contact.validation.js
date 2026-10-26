const { body } = require('express-validator');

const contactRules = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be a 10-digit number'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('name').optional().isString(),
];

module.exports = { contactRules };
