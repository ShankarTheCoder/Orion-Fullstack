const mongoose = require('mongoose');

// Media model for storing uploaded images and documents directly in MongoDB.
// Eliminates the need for external cloud storage (AWS S3, Cloudinary)
// and persists across serverless/ephemeral platforms like Vercel.
const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true, index: true },
    originalName: { type: String, default: '' },
    mimeType: { type: String, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true },
    folder: { type: String, default: 'products' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Media', mediaSchema);
