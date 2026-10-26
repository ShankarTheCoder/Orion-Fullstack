// Small formatting helpers shared across pages.
export const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export const ORDER_FLOW = ['Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];
export const DELIVERY_WINDOWS = ['7-10 AM', '12-3 PM', '5-8 PM'];
export const DELIVERY_CHARGE = 40;
export const FREE_DELIVERY_THRESHOLD = 499;
