const service = require('./users.service');

async function getProfile(req, res, next) {
  try {
    const data = await service.getProfile(req.user._id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const user = await service.updateProfile(req.user._id, req.body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile };
