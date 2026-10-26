const service = require('./addresses.service');

async function list(req, res, next) {
  try {
    const items = await service.listAddresses(req.user._id);
    res.json({ success: true, data: items, items, total: items.length });
  } catch (err) { next(err); }
}
async function create(req, res, next) {
  try { res.status(201).json({ success: true, data: await service.createAddress(req.user._id, req.body) }); } catch (err) { next(err); }
}
async function update(req, res, next) {
  try { res.json({ success: true, data: await service.updateAddress(req.user._id, req.params.id, req.body) }); } catch (err) { next(err); }
}
async function remove(req, res, next) {
  try { res.json({ success: true, ...(await service.deleteAddress(req.user._id, req.params.id)) }); } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
