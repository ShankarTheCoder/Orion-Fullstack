function getPagination(req) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(res, items, total, page, limit, extra = {}) {
  return res.json({
    success: true,
    data: items,
    items,
    total,
    page,
    pages: Math.ceil(total / limit) || 0,
    ...extra,
  });
}

module.exports = { getPagination, paginated };
