const service = require('./products.service');
const { getPagination, paginated } = require('../../utils/pagination');
const { uploadProductImage, toImageUrl } = require('../../utils/imageStorage');

// POST /api/v1/products/upload-image (admin) — multipart field "image",
// images only, max 5 MB. Returns { success: true, imageUrl } where imageUrl
// is a /uploads/products/<file> path served statically by the app.
function uploadImage(req, res) {
  uploadProductImage.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Image must be up to 5 MB' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Invalid image upload' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'An image file is required (form field: image)' });
    }
    return res.json({ success: true, imageUrl: toImageUrl(req.file) });
  });
}

async function list(req, res, next) {
  try {
    if (req.query.all === 'true' && req.user?.role !== 'admin') delete req.query.all;
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await service.listProducts(req.query, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}

async function detail(req, res, next) {
  try { res.json({ success: true, data: await service.getProduct(req.params.id) }); } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json({ success: true, data: await service.createProduct(req.body) }); } catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json({ success: true, data: await service.updateProduct(req.params.id, req.body) }); } catch (err) { next(err); }
}

async function updateStock(req, res, next) {
  try { res.json({ success: true, data: await service.updateStock(req.params.id, req.body.stock) }); } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) { next(err); }
}

module.exports = { list, detail, create, update, updateStock, remove, uploadImage };
