const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('./auth.controller');
const rules = require('./auth.validation');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, rules.registerRules, validate, controller.register);
router.post('/verify-email', authLimiter, rules.verifyEmailRules, validate, controller.verifyEmail);
router.post('/resend-otp', authLimiter, rules.resendOtpRules, validate, controller.resendOtp);
router.post('/login', authLimiter, rules.loginRules, validate, controller.login);
router.post('/admin/login', authLimiter, rules.loginRules, validate, controller.adminLogin);
router.get('/me', authenticate, controller.me);
router.post('/logout', authenticate, controller.logout);
router.put('/change-password', authenticate, rules.changePasswordRules, validate, controller.changePassword);

module.exports = router;
