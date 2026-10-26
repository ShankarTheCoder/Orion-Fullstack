const { body } = require('express-validator');

const addressRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be a 10-digit number'),
  body('line').trim().notEmpty().withMessage('Address line is required'),
  body('pincode').matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
  body('label').optional().isIn(['home', 'work', 'other']).withMessage('Label must be home, work or other'),
];

module.exports = { addressRules };
