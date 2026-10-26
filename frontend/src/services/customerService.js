// Customer profile, addresses, feedback/reviews and contact requests.
import { request, listOf, normUser } from './api';

export async function getProfile() {
  const data = await request('/users/profile');
  const d = data.data || data;
  return { user: normUser(d.user), addresses: (d.addresses || []).map((a) => ({ ...a, id: a.id ?? a._id })), orderCount: d.orderCount ?? 0 };
}

export async function updateProfile(payload) {
  const data = await request('/users/profile', { method: 'PUT', body: payload });
  return normUser(data.data || data);
}

export async function getAddresses() {
  const data = await request('/addresses');
  return listOf(data).map((a) => ({ ...a, id: a.id ?? a._id }));
}
export async function createAddress(payload) {
  const data = await request('/addresses', { method: 'POST', body: payload });
  const a = data.data || data;
  return { ...a, id: a.id ?? a._id };
}
export async function updateAddress(id, payload) {
  const data = await request(`/addresses/${id}`, { method: 'PUT', body: payload });
  const a = data.data || data;
  return { ...a, id: a.id ?? a._id };
}
export async function deleteAddress(id) {
  return request(`/addresses/${id}`, { method: 'DELETE' });
}

export async function submitFeedback(payload) {
  const data = await request('/feedback', { method: 'POST', body: payload, auth: false });
  return data.data || data;
}
export async function getFeedback(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  if (!qs.has('limit')) qs.set('limit', '50');
  const data = await request(`/feedback?${qs.toString()}`, { auth: false });
  return listOf(data).map((f) => ({ ...f, id: f.id ?? f._id, productName: f.product?.name || '' }));
}

export async function submitContact(payload) {
  const data = await request('/contact', { method: 'POST', body: payload, auth: false });
  return data.data || data;
}

export async function getMyPayments() {
  const data = await request('/payments/my?limit=100');
  return listOf(data).map((p) => ({ ...p, id: p.id ?? p._id }));
}
