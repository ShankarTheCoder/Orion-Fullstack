const service = require('./categories.service');

async function list(req, res, next) {
  try {
    const includeInactive = req.user?.role === 'admin' && req.query.all === 'true';
    const items = await service.listCategories({ activeOnly: !includeInactive });
    res.json({ success: true, data: items, items, total: items.length });
  } catch (err) { next(err); }
}

async function detail(req, res, next) {
  try { res.json({ success: true, data: await service.getCategory(req.params.id) }); } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json({ success: true, data: await service.createCategory(req.body) }); } catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json({ success: true, data: await service.updateCategory(req.params.id, req.body) }); } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const result = await service.deleteCategory(req.params.id);
    res.json({ success: true, message: result.deactivated ? 'Category deactivated (products still reference it)' : 'Category deleted', data: result });
  } catch (err) { next(err); }
}

module.exports = { list, detail, create, update, remove };
