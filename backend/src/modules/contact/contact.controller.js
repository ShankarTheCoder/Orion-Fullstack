const service = require('./contact.service');

async function submit(req, res, next) {
  try { res.status(201).json({ success: true, data: await service.submitContact(req.user, req.body) }); } catch (err) { next(err); }
}

module.exports = { submit };
