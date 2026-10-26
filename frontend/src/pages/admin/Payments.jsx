import { useState } from 'react';
import * as adminService from '../../services/adminService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDateTime } from '../../utils/format';

export default function Payments() {
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const { data, loading } = useFetch(() => adminService.getPayments({ method, status }), [method, status]);
  if (loading) return <Loader />;

  const items = data?.items || [];
  const collected = items.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Payment Records</h1>
      <p className="text-sm text-slate-500">Every checkout creates a payment record. COD stays “pending-collection” until delivery; card/UPI are recorded through the mock gateway.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All methods</option><option value="cod">COD</option><option value="card">Card</option><option value="upi">UPI</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option><option value="paid">Paid</option><option value="pending-collection">Pending collection</option><option value="refunded">Refunded</option><option value="failed">Failed</option><option value="created">Created</option>
        </select>
        <span className="ml-auto rounded-lg bg-farm-100 px-3 py-2 text-sm font-bold text-farm-800">Collected (paid): {formatPrice(collected)}</span>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">When</th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-slate-50">
                <td className="px-4 py-3 font-semibold">{p.orderNumber || p.order || '—'}</td>
                <td className="px-4 py-3">{p.customerName}<br /><span className="text-xs text-slate-400">{p.customerEmail}</span></td>
                <td className="px-4 py-3 uppercase">{p.method}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(p.amount)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.status === 'paid' ? 'bg-farm-100 text-farm-800' : p.status === 'refunded' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-xs text-slate-400">{p.gatewayPaymentId || p.gatewayOrderId || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No payment records match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
