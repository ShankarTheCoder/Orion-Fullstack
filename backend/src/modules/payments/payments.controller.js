const service = require('./payments.service');
const { getPagination, paginated } = require('../../utils/pagination');

async function mine(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await service.myPayments(req.user._id, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}

async function verify(req, res, next) {
  try { res.json({ success: true, data: await service.verifyMockPayment(req.user, req.body.paymentId) }); } catch (err) { next(err); }
}

module.exports = { mine, verify };
