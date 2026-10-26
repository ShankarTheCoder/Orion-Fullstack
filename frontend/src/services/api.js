// Core API client for the Orion Express backend.
// Base URL comes from VITE_API_URL (frontend/.env) and defaults to the local
// backend: http://localhost:5000/api/v1. The JWT from login/verification is
// attached to every request. Errors throw an Error with the server's message
// (plus .status and .fields when present) so pages can show them directly.

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');

const TOKEN_KEY = 'fp_token';
const USER_KEY = 'fp_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
};
export function saveSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty/non-JSON body */ }
  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    err.fields = data?.fields;
    throw err;
  }
  return data;
}

// ---- Response normalisers: API docs use Mongo _id; the UI uses id. --------
export function normProduct(p) {
  if (!p) return p;
  return {
    ...p,
    id: p.id ?? p._id,
    category: typeof p.category === 'object' ? p.category.name : p.category,
    categoryId: p.categoryId ?? (typeof p.category === 'object' ? p.category._id : p.category),
    dealFlags: p.dealFlags || [],
  };
}

export function normOrder(o) {
  if (!o) return o;
  return {
    ...o,
    id: o.id ?? o._id,
    total: o.total ?? o.grandTotal,
    items: (o.items || []).map((i) => ({ ...i, productId: i.productId ?? i.product })),
    customerName: o.user?.name || o.customerName || '',
    customerEmail: o.user?.email || o.customerEmail || '',
  };
}

export function normUser(u) {
  if (!u) return u;
  return { ...u, id: u.id ?? u._id };
}

export const listOf = (data) => (Array.isArray(data) ? data : data?.items || data?.data || []);
export { BASE_URL };
