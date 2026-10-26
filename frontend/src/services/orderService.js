// Orders: checkout, history, tracking, cancellation + admin order handling.
import { request, listOf, normOrder } from './api';

export async function getDeliveryWindows() {
  const data = await request('/orders/delivery-windows', { auth: false });
  return data.data || ['7-10 AM', '12-3 PM', '5-8 PM'];
}

export async function placeOrder(payload) {
  // Payload: { items?, addressId | address, deliveryDate, slotWindow, paymentMethod }
  // Totals are calculated by the SERVER - nothing price-related is trusted here.
  const data = await request('/orders', { method: 'POST', body: payload });
  return normOrder(data.data || data);
}

export async function getMyOrders() {
  const data = await request('/orders/my?limit=100');
  return listOf(data).map(normOrder);
}

export async function getOrder(id) {
  const data = await request(`/orders/${id}`);
  return normOrder(data.data || data);
}

export async function cancelOrder(id) {
  const data = await request(`/orders/${id}/cancel`, { method: 'PUT' });
  return normOrder(data.data || data);
}

// --- Admin ---
export async function getAdminOrders(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  if (!qs.has('limit')) qs.set('limit', '100');
  const data = await request(`/admin/orders?${qs.toString()}`);
  return { items: listOf(data).map(normOrder), total: data.total ?? listOf(data).length };
}

export async function updateOrderStatus(id, status) {
  const data = await request(`/admin/orders/${id}/status`, { method: 'PUT', body: { status } });
  return normOrder(data.data || data);
}
