// Client-side form validators (the backend re-validates everything - these
// exist only for fast, friendly feedback).
export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || ''));
export const isMobile = (v) => /^\d{10}$/.test(String(v || ''));
export const isPincode = (v) => /^\d{6}$/.test(String(v || ''));
export const isOtp = (v) => /^\d{6}$/.test(String(v || ''));

export function validateRegister({ name, mobile, email, password }) {
  const errors = {};
  if (!name?.trim()) errors.name = 'Name is required';
  if (!isMobile(mobile)) errors.mobile = 'Enter a 10-digit mobile number';
  if (!isEmail(email)) errors.email = 'Enter a valid email address';
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
  return errors;
}
