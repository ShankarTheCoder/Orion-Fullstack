// Image & Document Storage — Database (MongoDB) primary implementation.
//
// All uploaded images and documents are stored directly in MongoDB as binary
// data (Media collection). This completely eliminates the need for external
// cloud storage (AWS S3, Cloudinary), prevents ephemeral serverless filesystem
// loss on platforms like Vercel, and persists across redeployments.
//
// Rules: Images (jpg/jpeg/png/webp/gif), max 5 MB per file.
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Media = require('../models/Media.model');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads'); // backend/uploads
const PRODUCT_DIR = path.join(UPLOAD_ROOT, 'products');

try {
  fs.mkdirSync(PRODUCT_DIR, { recursive: true });
} catch {
  // On serverless platforms (e.g. Vercel), filesystems outside /tmp are read-only
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_DOC_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];

// Use memory storage so uploads work on read-only serverless filesystems (e.g. Vercel)
const storage = multer.memoryStorage();

function imageFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (MIME_TO_EXT[file.mimetype] && ALLOWED_IMAGE_EXTS.includes(ext)) return cb(null, true);
  const err = new Error('Only image files are allowed (jpg, jpeg, png, webp or gif)');
  err.code = 'INVALID_FILE_TYPE';
  return cb(err);
}

function docFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (MIME_TO_EXT[file.mimetype] && ALLOWED_DOC_EXTS.includes(ext)) return cb(null, true);
  const err = new Error('Only image and document files (jpg, jpeg, png, webp, gif, pdf) are allowed');
  err.code = 'INVALID_FILE_TYPE';
  return cb(err);
}

const uploadProductImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES },
});

const uploadDocument = multer({
  storage,
  fileFilter: docFileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES },
});

// Saves an uploaded file directly into MongoDB, and also best-effort caches to disk
async function saveMediaToDB(file, folder = 'products') {
  const ext = MIME_TO_EXT[file.mimetype] || path.extname(file.originalname || '').toLowerCase() || '.img';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const size = file.size || (file.buffer ? file.buffer.length : 0);

  // 1. Save directly into MongoDB
  await Media.create({
    filename,
    originalName: file.originalname || filename,
    mimeType: file.mimetype || 'application/octet-stream',
    data: file.buffer,
    size,
    folder,
  });

  // 2. Best-effort mirror write to local disk (if filesystem is writable)
  try {
    const targetDir = path.join(UPLOAD_ROOT, folder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, filename), file.buffer);
  } catch {
    // Expected on read-only serverless environments like Vercel
  }

  return `/uploads/${folder}/${filename}`;
}

async function saveProductImage(file) {
  return saveMediaToDB(file, 'products');
}

// Fallback helper
function toImageUrl(file) {
  return file.filename ? `/uploads/products/${file.filename}` : '';
}

// Best-effort removal of an uploaded file from MongoDB and local disk.
async function deleteLocalImage(imageUrl) {
  try {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) return;
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1];

    if (filename) {
      // Remove from MongoDB
      await Media.deleteOne({ filename }).catch(() => {});
    }

    // Also remove from disk if present
    const resolved = path.resolve(UPLOAD_ROOT, `.${imageUrl.replace(/^\/uploads/, '')}`);
    if (resolved.startsWith(UPLOAD_ROOT)) {
      fs.unlink(resolved, () => {});
    }
  } catch {
    /* ignore */
  }
}

module.exports = {
  uploadProductImage,
  uploadDocument,
  saveMediaToDB,
  saveProductImage,
  toImageUrl,
  deleteLocalImage,
  MAX_IMAGE_BYTES,
  UPLOAD_ROOT,
  PRODUCT_DIR,
};
