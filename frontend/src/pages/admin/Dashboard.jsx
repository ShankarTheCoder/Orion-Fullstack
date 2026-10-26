import * as adminService from '../../services/adminService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { formatPrice } from '../../utils/format';

export default function Dashboard() {
  const { data, loading, error } = useFetch(() => adminService.getDashboard(), []);
  if (loading) return <Loader />;
  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>;

  const c = data.counts || {};
  const cards = [
    ['🥦', c.products ?? 0, 'Products live'],
    ['📦', c.orders ?? 0, 'Total orders'],
    ['⏳', c.pendingOrders ?? 0, 'New (Placed)'],
    ['👥', c.customers ?? 0, 'Registered customers'],
    ['💰', formatPrice(data.revenue || 0), 'Revenue (excl. cancelled)'],
    ['💳', c.payments ?? 0, 'Payment records'],
    ['⭐', c.feedback ?? 0, 'Feedback received'],
    ['✉️', c.openContactRequests ?? 0, 'Open contact requests'],
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Admin Dashboard</h1>
      <p className="text-sm text-slate-500">Sales statistics and store overview — computed live from the database.</p>
      <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map(([icon, value, label]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-2xl">{icon}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-800">{value}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-extrabold text-farm-950">Orders by status</h2>
          <ul className="mt-3 space-y-2">
            {Object.entries(data.ordersByStatus || {}).map(([status, n]) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <span className="font-medium">{status}</span>
                <span className="rounded-full bg-farm-100 px-2.5 py-0.5 font-bold text-farm-800">{n}</span>
              </li>
            ))}
            {!Object.keys(data.ordersByStatus || {}).length && <li className="text-sm text-slate-400">No orders yet.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-extrabold text-farm-950">Top selling products</h2>
          <ul className="mt-3 space-y-2">
            {(data.topProducts || []).map((p) => (
              <li key={p.productId} className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-slate-500">{p.unitsSold} sold · <strong className="text-slate-800">{formatPrice(p.revenue)}</strong></span>
              </li>
            ))}
            {!data.topProducts?.length && <li className="text-sm text-slate-400">No sales yet.</li>}
          </ul>
        </div>
      </div>

      {!!data.lowStock?.length && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-extrabold text-amber-900">⚠️ Low stock (10 or less)</h2>
          <p className="mt-1 text-sm text-amber-800">{data.lowStock.map((p) => `${p.name} (${p.stock} ${p.unit})`).join(' · ')}</p>
        </div>
      )}
    </div>
  );
}
