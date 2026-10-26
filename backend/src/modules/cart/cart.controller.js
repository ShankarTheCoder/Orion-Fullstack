const service = require('./cart.service');

async function get(req, res, next) {
  try { res.json({ success: true, data: await service.getCart(req.user._id) }); } catch (err) { next(err); }
}
async function add(req, res, next) {
  try { res.json({ success: true, data: await service.addItem(req.user._id, req.body.productId, req.body.quantity || 1) }); } catch (err) { next(err); }
}
async function update(req, res, next) {
  try { res.json({ success: true, data: await service.updateItem(req.user._id, req.params.productId, req.body.quantity) }); } catch (err) { next(err); }
}
async function remove(req, res, next) {
  try { res.json({ success: true, data: await service.removeItem(req.user._id, req.params.productId) }); } catch (err) { next(err); }
}
async function clear(req, res, next) {
  try { res.json({ success: true, data: await service.clearCart(req.user._id) }); } catch (err) { next(err); }
}

module.exports = { get, add, update, remove, clear };
