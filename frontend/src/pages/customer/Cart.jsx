import { Link, useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { useToast } from '../../components/common/Toast';
import { formatPrice } from '../../utils/format';
import { productImageSrc } from '../../utils/image';

// Blinkit-style cart: one items card (thumb, name, pack size, green
// stepper, line total) + a "Bill details" card. All amounts come from the
// server cart - the backend computes subtotal / delivery / total.
export default function Cart() {
  const { cart, update, remove, busy } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const changeQty = async (item, qty) => {
    try {
      if (qty < 1) return;
      await update(item.productId || item.product?.id, qty);
    } catch (err) { toast.error(err.message); }
  };
  const removeItem = async (item) => {
    try { await remove(item.productId || item.product?.id); toast.success('Removed from cart'); }
    catch (err) { toast.error(err.message); }
  };

  if (!cart.items.length) {
    return (
      <div className="rounded-2xl border border-farm-100 bg-white p-10 text-center shadow-card">
        <p className="text-5xl">🧺</p>
        <h1 className="mt-3 text-xl font-extrabold text-farm-900">Your cart is empty</h1>
        <p className="mt-1 text-slate-500">Add some fresh fruits and vegetables to get started.</p>
        <Link to="/products" className="mt-4 inline-block rounded-lg bg-farm-600 px-6 py-2.5 font-semibold text-white hover:bg-farm-700">Browse products</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-900">My Cart</h1>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="divide-y divide-slate-100 rounded-2xl border border-farm-100 bg-white shadow-card">
          {cart.items.map((item) => {
            const p = item.product || {};
            const img = productImageSrc(p);
            return (
              <div key={item.productId || p.id} className="flex items-center gap-4 p-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-farm-50 text-3xl">
                  {img ? <img src={img} alt={item.name || p.name} className="h-full w-full object-cover" /> : (p.emoji || item.emoji || '🥬')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-800">{item.name || p.name}</p>
                  <p className="text-xs text-slate-500">1 {item.unit || p.unit}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{formatPrice(item.price ?? p.price)} /{item.unit || p.unit}</p>
                </div>
                <div className="flex items-center rounded-lg bg-farm-600 text-white shadow-sm">
                  <button disabled={busy} onClick={() => changeQty(item, item.quantity - 1)} className="px-3 py-1.5 font-extrabold disabled:opacity-60" aria-label="Decrease quantity">−</button>
                  <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                  <button disabled={busy} onClick={() => changeQty(item, item.quantity + 1)} className="px-3 py-1.5 font-extrabold disabled:opacity-60" aria-label="Increase quantity">+</button>
                </div>
                <p className="w-20 text-right font-extrabold text-slate-900">{formatPrice(item.lineTotal ?? (item.price || 0) * item.quantity)}</p>
                <button onClick={() => removeItem(item)} className="text-slate-300 transition hover:text-red-500" title="Remove" aria-label="Remove item">✕</button>
              </div>
            );
          })}
          <div className="p-4">
            <Link to="/products" className="text-sm font-semibold text-farm-700 hover:underline">+ Add more items</Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <h2 className="font-extrabold text-farm-900">Bill details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Item total</dt><dd className="font-semibold">{formatPrice(cart.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Delivery charge</dt>
                <dd className="font-semibold">{cart.deliveryCharge === 0 ? <span className="text-farm-700">FREE</span> : formatPrice(cart.deliveryCharge)}</dd></div>
              {cart.deliveryCharge > 0 && <p className="rounded-lg bg-farm-50 px-3 py-2 text-xs font-medium text-farm-800">Add {formatPrice(500 - cart.subtotal)} more to get FREE delivery (above ₹499).</p>}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold"><dt>Grand total</dt><dd>{formatPrice(cart.total)}</dd></div>
            </dl>
            <button onClick={() => navigate('/checkout')} className="mt-4 w-full rounded-xl bg-farm-600 py-3 font-bold text-white hover:bg-farm-700">
              Proceed to Checkout →
            </button>
          </div>
          <div className="rounded-2xl border border-farm-100 bg-farm-50 p-4 text-sm text-farm-900">
            <p className="font-bold">🚚 Delivery in Meerut</p>
            <p className="mt-1 text-farm-800">Same-day slots: 7-10 AM · 12-3 PM · 5-8 PM. Pay online or cash on delivery.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
