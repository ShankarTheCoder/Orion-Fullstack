import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import * as customerService from '../../services/customerService';
import * as orderService from '../../services/orderService';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { formatPrice, DELIVERY_WINDOWS } from '../../utils/format';
import { isMobile, isPincode } from '../../utils/validators';

const EMPTY_ADDR = { fullName: '', mobile: '', line: '', area: '', city: 'Meerut', pincode: '', label: 'home' };

export default function Checkout() {
  const { cart, clear, refresh } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState({ ...EMPTY_ADDR, fullName: user?.name || '', mobile: user?.mobile || '' });
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotWindow, setSlotWindow] = useState(DELIVERY_WINDOWS[2]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    customerService.getAddresses()
      .then((list) => {
        setAddresses(list);
        if (list.length) setSelectedAddressId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingAddr(false));
  }, []);

  const itemsPayload = useMemo(
    () => cart.items.map((i) => ({ productId: i.productId || i.product?.id, quantity: i.quantity })),
    [cart]
  );

  const place = async (e) => {
    e.preventDefault();
    setError('');
    let payload = { items: itemsPayload, deliveryDate, slotWindow, paymentMethod };
    if (selectedAddressId) {
      payload.addressId = selectedAddressId;
    } else {
      if (!newAddress.fullName.trim() || !newAddress.line.trim()) return setError('Enter your name and address, or pick a saved address.');
      if (!isMobile(newAddress.mobile)) return setError('Enter a 10-digit mobile number for delivery.');
      if (!isPincode(newAddress.pincode)) return setError('Enter a 6-digit pincode.');
      payload.address = newAddress;
    }
    setPlacing(true);
    try {
      const order = await orderService.placeOrder(payload);
      await refresh();
      navigate('/order-success', { state: { order } });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally { setPlacing(false); }
  };

  if (loadingAddr) return <Loader />;
  if (!cart.items.length) {
    return (
      <div className="rounded-2xl border border-farm-100 bg-white p-10 text-center shadow-card">
        <p className="text-5xl">🧺</p>
        <h1 className="mt-3 text-xl font-extrabold text-farm-900">Nothing to check out</h1>
        <p className="mt-1 text-slate-500">Your cart is empty. Add some fresh produce first.</p>
        <button onClick={() => navigate('/products')} className="mt-4 rounded-lg bg-farm-600 px-6 py-2.5 font-semibold text-white">Browse products</button>
      </div>
    );
  }

  const addrField = (k, props = {}) => (
    <input value={newAddress[k]} onChange={(e) => setNewAddress((a) => ({ ...a, [k]: e.target.value }))} {...props}
      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" />
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-900">Checkout</h1>
      <form onSubmit={place} className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <h2 className="font-extrabold text-farm-900">1 · Delivery address</h2>
            {addresses.length > 0 && (
              <div className="mt-3 space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${selectedAddressId === a.id ? 'border-farm-500 bg-farm-50' : 'border-slate-200'}`}>
                    <input type="radio" name="addr" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} className="mt-1" />
                    <span className="text-sm"><strong>{a.fullName}</strong> ({a.label})<br />{a.line}{a.area ? `, ${a.area}` : ''}, {a.city} — {a.pincode}<br />📱 {a.mobile}</span>
                  </label>
                ))}
                <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${!selectedAddressId ? 'border-farm-500 bg-farm-50' : 'border-slate-200'}`}>
                  <input type="radio" name="addr" checked={!selectedAddressId} onChange={() => setSelectedAddressId('')} className="mt-1" />
                  <span className="text-sm font-medium">Use a new address</span>
                </label>
              </div>
            )}
            {!selectedAddressId && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label className="text-sm font-medium">Full name</label>{addrField('fullName')}</div>
                <div><label className="text-sm font-medium">Mobile</label>{addrField('mobile', { inputMode: 'numeric' })}</div>
                <div className="sm:col-span-2"><label className="text-sm font-medium">Address line</label>{addrField('line')}</div>
                <div><label className="text-sm font-medium">Area</label>{addrField('area')}</div>
                <div><label className="text-sm font-medium">Pincode</label>{addrField('pincode', { inputMode: 'numeric' })}</div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <h2 className="font-extrabold text-farm-900">2 · Delivery slot</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-medium">Delivery date</label>
                <input type="date" value={deliveryDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDeliveryDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" /></div>
              <div><label className="text-sm font-medium">Time window</label>
                <div className="mt-1 flex gap-2">
                  {DELIVERY_WINDOWS.map((w) => (
                    <button type="button" key={w} onClick={() => setSlotWindow(w)}
                      className={`flex-1 rounded-lg border px-2 py-2.5 text-sm font-semibold ${slotWindow === w ? 'border-farm-600 bg-farm-600 text-white' : 'border-slate-300'}`}>{w}</button>
                  ))}
                </div></div>
            </div>
          </section>

          <section className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <h2 className="font-extrabold text-farm-900">3 · Payment method</h2>
            <div className="mt-3 space-y-2">
              {[
                ['cod', '💵 Cash on Delivery', 'Pay in cash when your order arrives.'],
                ['card', '💳 Card (mock gateway)', 'Recorded as paid via the demo gateway — no real charge.'],
                ['upi', '📱 UPI (mock gateway)', 'Recorded as paid via the demo gateway — no real charge.'],
              ].map(([value, title, sub]) => (
                <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${paymentMethod === value ? 'border-farm-500 bg-farm-50' : 'border-slate-200'}`}>
                  <input type="radio" name="pay" checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} className="mt-1" />
                  <span className="text-sm"><strong>{title}</strong><br /><span className="text-slate-500">{sub}</span></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="h-fit rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
          <h2 className="font-extrabold text-farm-900">Bill details</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {cart.items.map((i) => (
              <li key={i.productId || i.product?.id} className="flex justify-between">
                <span>{i.name || i.product?.name} × {i.quantity}</span>
                <span className="font-medium">{formatPrice(i.lineTotal ?? (i.price || 0) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Item total</dt><dd className="font-semibold">{formatPrice(cart.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Delivery charge</dt><dd className="font-semibold">{cart.deliveryCharge === 0 ? <span className="text-farm-700">FREE</span> : formatPrice(cart.deliveryCharge)}</dd></div>
            <div className="flex justify-between text-base font-extrabold"><dt>Grand total</dt><dd>{formatPrice(cart.total)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-slate-400">Final totals are re-calculated on the server from live prices when you place the order.</p>
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <button disabled={placing} className="mt-4 w-full rounded-lg bg-farm-600 py-3 font-bold text-white hover:bg-farm-700 disabled:opacity-60">
            {placing ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
