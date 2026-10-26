// Resolves a product's image to a displayable src.
// - Uploaded images are stored on the backend and come back as
//   "/uploads/products/<file>" — they must be prefixed with the backend
//   ORIGIN (VITE_API_URL without its /api/v1 suffix), not the API base.
// - Full URLs (e.g. seeded https:// images) are used as-is.
// - Empty value returns '' so callers can fall back to the product emoji.
import { BASE_URL } from '../services/api';

export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');

export function productImageSrc(product) {
  const url = product?.imageUrl || product?.image || '';
  if (!url) return '';
  if (url.startsWith('/uploads')) return API_ORIGIN + url;
  return url;
}
