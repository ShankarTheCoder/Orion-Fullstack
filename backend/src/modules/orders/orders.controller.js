const service = require('./orders.service');
const { getPagination, paginated } = require('../../utils/pagination');
const { DELIVERY_WINDOWS } = require('../../utils/constants');

async function deliveryWindows(req, res) {
  res.json({ success: true, data: DELIVERY_WINDOWS });
}

async function place(req, res, next) {
  try { res.status(201).json({ success: true, data: await service.placeOrder(req.user, req.body) }); } catch (err) { next(err); }
}

async function mine(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await service.myOrders(req.user._id, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}

async function detail(req, res, next) {
  try { res.json({ success: true, data: await service.getOrderForUser(req.user, req.params.id) }); } catch (err) { next(err); }
}

async function cancel(req, res, next) {
  try { res.json({ success: true, data: await service.cancelOrder(req.user, req.params.id) }); } catch (err) { next(err); }
}

module.exports = { deliveryWindows, place, mine, detail, cancel };
