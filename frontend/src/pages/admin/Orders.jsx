import { useState } from 'react';
import * as orderService from '../../services/orderService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { formatPrice, formatDateTime, ORDER_FLOW } from '../../utils/format';

const NEXT = { Placed: ['Confirmed', 'Cancelled'], Confirmed: ['Packed', 'Cancelled'], Packed: ['Out for Delivery'], 'Out for Delivery': ['Delivered'], Delivered: [], Cancelled: [] };

export default function Orders() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const { data, loading, error, refetch } = useFetch(() => orderService.getAdminOrders({ status: statusFilter }), [statusFilter]);
  const [updating, setUpdating] = useState('');

  const change = async (order, status) => {
    setUpdating(order.id);
    try {
      await orderService.updateOrderStatus(order.id, status);
      toast.success(`Order ${order.orderNumber || ''} → ${status}`);
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(''); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Orders</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {['', ...ORDER_FLOW, 'Cancelled'].map((s) => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusFilter === s ? 'bg-farm-600 text-white' : 'border border-slate-300 bg-white'}`}>
            {s || 'All statuses'}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-4 space-y-3">
        {(data?.items || []).map((o) => (
          <article key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold">{o.orderNumber || o.id}
                <span className="ml-2 text-sm font-medium text-slate-500">{o.customerName} ({o.customerEmail})</span></p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${o.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-farm-100 text-farm-800'}`}>{o.status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(' · ')}</p>
            <p className="text-sm text-slate-500">🚚 {o.deliveryDate} · {o.slotWindow} → {o.address?.line}, {o.address?.city} — {o.address?.pincode} · <span className="uppercase">{o.paymentMethod}</span> ({o.paymentStatus}) · {formatDateTime(o.createdAt)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-extrabold">{formatPrice(o.total)}</span>
              <span className="text-slate-300">|</span>
              {(NEXT[o.status] || []).map((s) => (
                <button key={s} disabled={updating === o.id} onClick={() => change(o, s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${s === 'Cancelled' ? 'bg-red-600 text-white' : 'bg-farm-600 text-white'}`}>
                  Mark {s}
                </button>
              ))}
              {!(NEXT[o.status] || []).length && <span className="text-xs text-slate-400">Terminal state — no further actions.</span>}
            </div>
          </article>
        ))}
        {!data?.items?.length && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">No orders in this view.</p>}
      </div>
    </div>
  );
}
