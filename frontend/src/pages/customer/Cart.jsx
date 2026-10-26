import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import * as customerService from '../../services/customerService';
import * as orderService from '../../services/orderService';
import { useToast } from '../../components/common/Toast';
import { formatPrice, DELIVERY_WINDOWS } from '../../utils/format';
import { productImageSrc } from '../../utils/image';
import { isMobile, isPincode } from '../../utils/validators';

const EMPTY_ADDR = { fullName: '', mobile: '', line: '', area: '', city: 'Meerut', pincode: '', label: 'home' };

export default function Cart() {
  const { cart, update, remove, busy, refresh } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ ...EMPTY_ADDR, fullName: user?.name || '', mobile: user?.mobile || '' });
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotWindow, setSlotWindow] = useState(DELIVERY_WINDOWS[2]); // default 5-8 PM
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    customerService.getAddresses()
      .then((list) => {
        setAddresses(list);
        if (list.length > 0) {
          setSelectedAddressId(list[0].id);
          setShowNewAddress(false);
        } else {
          setShowNewAddress(true);
        }
      })
      .catch(() => {});
  }, []);

  const changeQty = async (item, qty) => {
    try {
      if (qty < 1) return;
      await update(item.productId || item.product?.id, qty);
    } catch (err) { toast.error(err.message); }
  };

  const removeItem = async (item) => {
    try {
      await remove(item.productId || item.product?.id);
      toast.success('Removed from cart');
    } catch (err) { toast.error(err.message); }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setOrderError('');

    let payload = {
      items: cart.items.map((i) => ({ productId: i.productId || i.product?.id, quantity: i.quantity })),
      deliveryDate,
      slotWindow,
      paymentMethod,
    };

    if (!showNewAddress && selectedAddressId) {
      payload.addressId = selectedAddressId;
    } else {
      if (!newAddress.fullName.trim() || !newAddress.line.trim()) {
        return setOrderError('Please enter delivery name and street address.');
      }
      if (!isMobile(newAddress.mobile)) {
        return setOrderError('Enter a valid 10-digit mobile number for delivery.');
      }
      if (!isPincode(newAddress.pincode)) {
        return setOrderError('Enter a 6-digit Meerut pincode (e.g. 250001).');
      }
      payload.address = newAddress;
    }

    setPlacing(true);
    try {
      const order = await orderService.placeOrder(payload);
      await refresh();
      toast.success('Order placed successfully! Tracking your delivery now.');
      navigate('/customer/order-success', { state: { order } });
    } catch (err) {
      setOrderError(err.message);
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (!cart.items.length) {
    return (
      <div className="rounded-2xl border border-farm-100 bg-white p-10 text-center shadow-card">
        <p className="text-5xl">🧺</p>
        <h1 className="mt-3 text-xl font-extrabold text-farm-900">Your cart is empty</h1>
        <p className="mt-1 text-slate-500">Add some fresh fruits and vegetables to get started.</p>
        <Link to="/customer/products" className="mt-4 inline-block rounded-lg bg-farm-600 px-6 py-2.5 font-semibold text-white hover:bg-farm-700">Browse products</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-farm-900">My Cart</h1>
          <p className="text-xs text-slate-500">Review items and order fresh produce directly from your cart.</p>
        </div>
        <Link to="/customer/products" className="text-xs font-semibold text-farm-700 hover:underline">
          + Continue shopping
        </Link>
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Cart Items List */}
        <div className="divide-y divide-slate-100 rounded-2xl border border-farm-100 bg-white shadow-card">
          <div className="px-5 py-3 bg-farm-50/60 rounded-t-2xl border-b border-farm-100 flex justify-between items-center text-xs font-bold text-farm-800">
            <span>ITEMS IN CART ({cart.items.length})</span>
            <span>SUBTOTAL: {formatPrice(cart.subtotal)}</span>
          </div>

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
          <div className="p-4 flex justify-between items-center text-sm">
            <Link to="/customer/products" className="font-semibold text-farm-700 hover:underline">+ Add more items</Link>
            <span className="text-xs text-slate-400">Prices inclusive of all taxes</span>
          </div>
        </div>

        {/* Right: Quick Order & Bill Card */}
        <div className="space-y-4">
          {/* Bill Details */}
          <div className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <h2 className="font-extrabold text-farm-900">Bill details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Item total</dt><dd className="font-semibold">{formatPrice(cart.subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Delivery charge</dt>
                <dd className="font-semibold">{cart.deliveryCharge === 0 ? <span className="text-farm-700 font-bold">FREE</span> : formatPrice(cart.deliveryCharge)}</dd>
              </div>
              {cart.deliveryCharge > 0 && (
                <p className="rounded-lg bg-farm-50 px-3 py-2 text-xs font-medium text-farm-800">
                  Add {formatPrice(500 - cart.subtotal)} more to get FREE delivery (above ₹499).
                </p>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold text-farm-950">
                <dt>Grand total</dt>
                <dd>{formatPrice(cart.total)}</dd>
              </div>
            </dl>
          </div>

          {/* Direct Order Form directly through Cart */}
          <form onSubmit={handlePlaceOrder} className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="font-extrabold text-farm-900 text-sm uppercase tracking-wide">
                📦 Order Through Cart
              </h2>
              <span className="text-[11px] font-bold text-farm-600 bg-farm-50 px-2 py-0.5 rounded-full">
                Quick Checkout
              </span>
            </div>

            {/* Address Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Delivery Address</label>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(!showNewAddress)}
                    className="text-[11px] font-semibold text-farm-700 hover:underline"
                  >
                    {showNewAddress ? 'Pick saved address' : '+ Add new'}
                  </button>
                )}
              </div>

              {!showNewAddress && addresses.length > 0 ? (
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-farm-500 focus:bg-white"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label ? `[${a.label.toUpperCase()}] ` : ''}{a.fullName} — {a.line}, {a.city} ({a.pincode})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <input
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress((a) => ({ ...a, fullName: e.target.value }))}
                    placeholder="Recipient name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-farm-500"
                  />
                  <input
                    value={newAddress.mobile}
                    onChange={(e) => setNewAddress((a) => ({ ...a, mobile: e.target.value }))}
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-farm-500"
                  />
                  <input
                    value={newAddress.line}
                    onChange={(e) => setNewAddress((a) => ({ ...a, line: e.target.value }))}
                    placeholder="Address (House/Flat, Street, Area)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-farm-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newAddress.city}
                      disabled
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-500"
                    />
                    <input
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress((a) => ({ ...a, pincode: e.target.value }))}
                      placeholder="Pincode (e.g. 250001)"
                      inputMode="numeric"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-farm-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Slot */}
            <div>
              <label className="text-xs font-bold text-slate-700">Delivery Slot</label>
              <div className="mt-1.5 flex gap-1.5">
                {DELIVERY_WINDOWS.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setSlotWindow(slot)}
                    className={`flex-1 rounded-lg border py-1.5 text-[11px] font-bold transition ${
                      slotWindow === slot
                        ? 'border-farm-600 bg-farm-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-bold text-slate-700">Payment Option</label>
              <div className="mt-1.5 space-y-1 text-xs">
                {[
                  ['cod', '💵 Cash on Delivery (COD)'],
                  ['card', '💳 Card (Mock Demo)'],
                  ['upi', '📱 UPI (Mock Demo)'],
                ].map(([method, label]) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 transition ${
                      paymentMethod === method ? 'border-farm-500 bg-farm-50 font-bold text-farm-900' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cartPaymentMethod"
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {orderError && (
              <p className="rounded-lg bg-red-50 p-2 text-xs font-medium text-red-700">
                {orderError}
              </p>
            )}

            {/* Place Order directly from cart button */}
            <button
              type="submit"
              disabled={placing || busy}
              className="w-full rounded-xl bg-farm-600 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-farm-700 disabled:opacity-60"
            >
              {placing ? 'Placing your order…' : `Place Order · ${formatPrice(cart.total)}`}
            </button>

            <Link
              to="/customer/checkout"
              className="block text-center text-xs font-semibold text-slate-500 hover:text-farm-700 hover:underline"
            >
              Or open detailed checkout page →
            </Link>
          </form>

          <div className="rounded-2xl border border-farm-100 bg-farm-50 p-3.5 text-xs text-farm-900">
            <p className="font-bold">🚚 Fast Meerut Delivery</p>
            <p className="mt-0.5 text-farm-800">Fresh produce quality-checked before departure. Pay safely online or at your door.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
