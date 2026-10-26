const { body } = require('express-validator');

const updateProfileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('mobile').optional().matches(/^\d{10}$/).withMessage('Mobile must be a 10-digit number'),
];

module.exports = { updateProfileRules };
