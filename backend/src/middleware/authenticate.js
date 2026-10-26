// JWT authentication (PDF Sections 3/7). Verifies the Bearer token and loads
// the user. Missing/invalid/expired token -> 401. A BLOCKED account is
// refused here too, so blocking a customer takes effect immediately.
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User.model');

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], config.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
}

// Optional auth: attaches req.user when a valid token is present, but never
// rejects. Used on public endpoints that behave better when logged in
// (e.g. submitting feedback with your account attached).
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.split(' ')[1], config.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.status !== 'blocked') req.user = user;
  } catch (err) { /* ignore - public request */ }
  next();
}

module.exports = { authenticate, optionalAuth };
