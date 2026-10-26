import { Link, useLocation } from 'react-router-dom';
import { formatPrice } from '../../utils/format';

export default function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order;
  return (
    <div className="rounded-2xl border border-farm-100 bg-white p-10 text-center shadow-card">
      <p className="text-6xl">🎉</p>
      <h1 className="mt-3 text-2xl font-extrabold text-farm-900">Order placed successfully!</h1>
      {order ? (
        <div className="mx-auto mt-4 max-w-md space-y-1 text-sm text-slate-600">
          <p>Order number: <strong className="text-slate-900">{order.orderNumber || order.id}</strong></p>
          <p>Deliver to: {order.address?.line}, {order.address?.city} — {order.address?.pincode}</p>
          <p>Slot: {order.deliveryDate} · {order.slotWindow}</p>
          <p>Payment: <span className="uppercase">{order.paymentMethod}</span> · {order.paymentStatus}</p>
          <p className="text-base font-extrabold text-slate-900">Total: {formatPrice(order.total)}</p>
        </div>
      ) : <p className="mt-2 text-slate-500">Your order has been placed.</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/customer/orders" className="rounded-lg bg-farm-600 px-6 py-2.5 font-semibold text-white hover:bg-farm-700">Track my orders</Link>
        <Link to="/products" className="rounded-lg border border-farm-300 px-6 py-2.5 font-semibold text-farm-800">Continue shopping</Link>
      </div>
    </div>
  );
}
