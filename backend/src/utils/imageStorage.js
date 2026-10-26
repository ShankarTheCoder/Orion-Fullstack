// Product image storage — LOCAL DISK implementation.
//
// This is the single storage point for product images: the upload route and
// the product service only talk to this module, so swapping to Cloudinary
// later means replacing save/delete here (e.g. with the Cloudinary SDK and
// CLOUDINARY_* env keys) without touching routes, controllers or the UI.
//
// Files live in backend/uploads/products/ and are served by Express at
// /uploads/products/<file> (see src/app.js). Rules: images only
// (jpg/jpeg/png/webp/gif), maximum 5 MB per file.
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads'); // backend/uploads
const PRODUCT_DIR = path.join(UPLOAD_ROOT, 'products');
fs.mkdirSync(PRODUCT_DIR, { recursive: true });

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRODUCT_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.img';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (MIME_TO_EXT[file.mimetype] && ALLOWED_EXTS.includes(ext)) return cb(null, true);
  const err = new Error('Only image files are allowed (jpg, jpeg, png, webp or gif)');
  err.code = 'INVALID_FILE_TYPE';
  return cb(err);
}

const uploadProductImage = multer({ storage, fileFilter, limits: { fileSize: MAX_IMAGE_BYTES } });

// Public URL for a stored upload (served by the /uploads static mount).
function toImageUrl(file) {
  return `/uploads/products/${file.filename}`;
}

// Best-effort removal of a previously uploaded local image. Only paths under
// /uploads/ are touched (full remote URLs are ignored), the resolved path is
// verified to stay inside the uploads root (path-traversal guard), and all
// errors are swallowed — cleanup must never fail a product write.
function deleteLocalImage(imageUrl) {
  try {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) return;
    const resolved = path.resolve(UPLOAD_ROOT, `.${imageUrl.replace(/^\/uploads/, '')}`);
    if (!resolved.startsWith(UPLOAD_ROOT)) return;
    fs.unlink(resolved, () => {});
  } catch { /* ignore */ }
}

module.exports = { uploadProductImage, toImageUrl, deleteLocalImage, MAX_IMAGE_BYTES, UPLOAD_ROOT, PRODUCT_DIR };
