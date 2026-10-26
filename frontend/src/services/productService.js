// Public catalogue + admin product/category management.
import { request, listOf, normProduct, getToken, BASE_URL } from './api';

export async function getProducts(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, v);
  if (!qs.has('limit')) qs.set('limit', '100');
  const data = await request(`/products?${qs.toString()}`, { auth: false });
  return { items: listOf(data).map(normProduct), total: data.total ?? listOf(data).length, page: data.page, pages: data.pages };
}

export async function getProduct(id) {
  const data = await request(`/products/${id}`, { auth: false });
  return normProduct(data.data || data);
}

export async function getCategories() {
  const data = await request('/categories', { auth: false });
  return listOf(data).map((c) => ({ ...c, id: c.id ?? c._id }));
}

// --- Admin ---
// Uploads a product image (multipart, images only, max 5 MB — enforced
// server-side too). Returns the imageUrl to store on the product.
export async function uploadProductImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const token = getToken();
  const res = await fetch(`${BASE_URL}/products/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.message) || `Image upload failed (${res.status})`);
  return data.imageUrl;
}

export async function createProduct(payload) {
  const data = await request('/products', { method: 'POST', body: payload });
  return normProduct(data.data || data);
}
export async function updateProduct(id, payload) {
  const data = await request(`/products/${id}`, { method: 'PUT', body: payload });
  return normProduct(data.data || data);
}
export async function updateStock(id, stock) {
  const data = await request(`/products/${id}/stock`, { method: 'PATCH', body: { stock } });
  return normProduct(data.data || data);
}
export async function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' });
}
export async function createCategory(payload) {
  const data = await request('/categories', { method: 'POST', body: payload });
  return data.data || data;
}
export async function updateCategory(id, payload) {
  const data = await request(`/categories/${id}`, { method: 'PUT', body: payload });
  return data.data || data;
}
export async function deleteCategory(id) {
  return request(`/categories/${id}`, { method: 'DELETE' });
}
export async function getAllCategoriesAdmin() {
  const data = await request('/categories?all=true');
  return listOf(data).map((c) => ({ ...c, id: c.id ?? c._id }));
}
