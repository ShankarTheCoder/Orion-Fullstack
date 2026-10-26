// Customer cart (server-side; guests have no cart - the API returns 401).
import { request } from './api';

const normCart = (data) => data.data || data;

export async function getCart() { return normCart(await request('/cart')); }
export async function addToCart(productId, quantity = 1) {
  return normCart(await request('/cart/items', { method: 'POST', body: { productId, quantity } }));
}
export async function updateCartItem(productId, quantity) {
  return normCart(await request(`/cart/items/${productId}`, { method: 'PUT', body: { quantity } }));
}
export async function removeCartItem(productId) {
  return normCart(await request(`/cart/items/${productId}`, { method: 'DELETE' }));
}
export async function clearCart() { return normCart(await request('/cart', { method: 'DELETE' })); }
