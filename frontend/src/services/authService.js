// Authentication + email OTP verification (Resend) endpoints.
import { request, saveSession, clearSession, normUser } from './api';

export async function register(payload) {
  // Creates an UNVERIFIED account and emails a 6-digit OTP. No token yet.
  const data = await request('/auth/register', { method: 'POST', body: payload, auth: false });
  return { user: normUser(data.user || data.data), message: data.message };
}

export async function verifyEmail(email, otp) {
  // On success the account is verified and a JWT session is returned.
  const data = await request('/auth/verify-email', { method: 'POST', body: { email, otp }, auth: false });
  const user = normUser(data.user || data.data);
  saveSession(data.token, user);
  return { user, token: data.token };
}

export async function resendOtp(email) {
  const data = await request('/auth/resend-otp', { method: 'POST', body: { email }, auth: false });
  return data.message;
}

export async function login(email, password) {
  const data = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  const user = normUser(data.user || data.data);
  saveSession(data.token, user);
  return { user, token: data.token };
}

export async function getMe() {
  const data = await request('/auth/me');
  return normUser(data.user || data.data);
}

export async function logout() {
  try { await request('/auth/logout', { method: 'POST' }); } catch { /* stateless JWT */ }
  clearSession();
}

export async function changePassword(currentPassword, newPassword) {
  return request('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword } });
}
