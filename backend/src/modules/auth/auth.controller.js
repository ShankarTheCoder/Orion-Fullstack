const service = require('./auth.service');

async function register(req, res, next) {
  try {
    const { status, body } = await service.register(req.body);
    res.status(status).json({ ...body, data: body.user });
  } catch (err) { next(err); }
}

async function verifyEmail(req, res, next) {
  try {
    const { body } = await service.verifyEmail(req.body.email, req.body.otp);
    res.json({ ...body, data: body.user });
  } catch (err) { next(err); }
}

async function resendOtp(req, res, next) {
  try {
    const { message } = await service.resendOtp(req.body.email);
    res.json({ success: true, message });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { body } = await service.login(req.body.email, req.body.password);
    res.json({ ...body, data: body.user });
  } catch (err) { next(err); }
}

async function adminLogin(req, res, next) {
  try {
    const { body } = await service.login(req.body.email, req.body.password, { adminOnly: true });
    res.json({ ...body, data: body.user });
  } catch (err) { next(err); }
}

async function me(req, res) {
  res.json({ success: true, data: req.user.toSafeJSON(), user: req.user.toSafeJSON() });
}

// JWT is stateless - logout is client-side token removal; endpoint exists so
// the frontend has a real call to make (and for future token blocklists).
async function logout(req, res) {
  res.json({ success: true, message: 'Logged out' });
}

async function changePassword(req, res, next) {
  try {
    const { message } = await service.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, message });
  } catch (err) { next(err); }
}

module.exports = { register, verifyEmail, resendOtp, login, adminLogin, me, logout, changePassword };
