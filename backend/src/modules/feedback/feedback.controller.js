const service = require('./feedback.service');
const { getPagination, paginated } = require('../../utils/pagination');

async function submit(req, res, next) {
  try { res.status(201).json({ success: true, data: await service.submitFeedback(req.user, req.body) }); } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await service.listFeedback(req.query, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}

module.exports = { submit, list };
