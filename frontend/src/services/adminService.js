// Admin management endpoints: dashboard/sales, customers, payments,
// feedback moderation and contact-request management.
import { request, listOf, normUser, normOrder } from './api';

export async function getDashboard() {
  const data = await request('/admin/dashboard');
  return data.data || data;
}

export async function getCustomers(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  if (!qs.has('limit')) qs.set('limit', '100');
  const data = await request(`/admin/customers?${qs.toString()}`);
  return { items: listOf(data).map(normUser), total: data.total ?? listOf(data).length };
}

export async function getCustomerDetail(id) {
  const data = await request(`/admin/customers/${id}`);
  const d = data.data || data;
  return { customer: normUser(d.customer), orders: (d.orders || []).map(normOrder), totalSpent: d.totalSpent ?? 0 };
}

export async function setCustomerStatus(id, status) {
  const data = await request(`/admin/customers/${id}/status`, { method: 'PATCH', body: { status } });
  return normUser(data.data || data);
}

export async function getPayments(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  if (!qs.has('limit')) qs.set('limit', '100');
  const data = await request(`/admin/payments?${qs.toString()}`);
  return {
    items: listOf(data).map((p) => ({
      ...p, id: p.id ?? p._id,
      orderNumber: p.order?.orderNumber || '', customerName: p.user?.name || '', customerEmail: p.user?.email || '',
    })),
    total: data.total ?? listOf(data).length,
  };
}

export async function getAdminFeedback() {
  const data = await request('/admin/feedback?limit=100');
  return listOf(data).map((f) => ({ ...f, id: f.id ?? f._id, productName: f.product?.name || '' }));
}
export async function deleteFeedback(id) {
  return request(`/admin/feedback/${id}`, { method: 'DELETE' });
}

export async function getContactRequests(status) {
  const data = await request(`/admin/contact-requests?limit=100${status ? `&status=${status}` : ''}`);
  return listOf(data).map((c) => ({ ...c, id: c.id ?? c._id }));
}
export async function resolveContactRequest(id) {
  const data = await request(`/admin/contact-requests/${id}/resolve`, { method: 'PATCH' });
  return data.data || data;
}
export async function deleteContactRequest(id) {
  return request(`/admin/contact-requests/${id}`, { method: 'DELETE' });
}
