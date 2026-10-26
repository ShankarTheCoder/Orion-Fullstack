const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be a 10-digit number'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

const verifyEmailRules = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('otp').matches(/^\d{6}$/).withMessage('OTP must be a 6-digit code'),
];

const resendOtpRules = [
  body('email').isEmail().withMessage('A valid email is required'),
];

module.exports = { registerRules, loginRules, changePasswordRules, verifyEmailRules, resendOtpRules };
