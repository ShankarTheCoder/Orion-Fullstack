import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import * as orderService from '../../services/orderService';
import * as customerService from '../../services/customerService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDate } from '../../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { count } = useCart();
  const { data, loading } = useFetch(async () => {
    const [orders, profile] = await Promise.all([
      orderService.getMyOrders(),
      customerService.getProfile(),
    ]);
    return { orders, profile };
  }, []);

  if (loading) return <Loader />;
  const orders = data?.orders || [];
  const delivered = orders.filter((o) => o.status === 'Delivered').length;
  const spent = orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + (o.total || 0), 0);
  const recent = orders.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Namaste, {user?.name} 👋</h1>
      <p className="text-sm text-slate-500">Your Orion account at a glance — orders, cart and spending, live from your account.</p>
      <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          ['📦', orders.length, 'Total orders'],
          ['✅', delivered, 'Orders delivered'],
          ['🛒', count, 'Items in cart'],
          ['💰', formatPrice(spent), 'Total spent'],
        ].map(([icon, value, label]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-2xl">{icon}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-800">{value}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-farm-900">Recent orders</h2>
          <Link to="/customer/orders" className="text-sm font-semibold text-farm-700 hover:underline">View all →</Link>
        </div>
        {recent.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <span className="font-bold text-slate-800">{o.orderNumber || o.id}</span>
                  <span className="ml-2 text-sm text-slate-500">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(' · ')}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatDate(o.createdAt)}</span>
                  <span className="rounded-full bg-farm-100 px-2.5 py-1 text-xs font-bold text-farm-800">{o.status}</span>
                  <span className="font-bold">{formatPrice(o.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No orders yet — <Link to="/products" className="font-semibold text-farm-700">start shopping</Link>.</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link to="/products" className="rounded-2xl bg-farm-600 p-5 font-bold text-white shadow-card hover:bg-farm-700">🛒 Continue shopping</Link>
        <Link to="/customer/orders" className="rounded-2xl border border-farm-200 bg-white p-5 font-bold text-farm-800 shadow-card hover:bg-farm-50">🚚 Track orders</Link>
        <Link to="/cart" className="rounded-2xl border border-farm-200 bg-white p-5 font-bold text-farm-800 shadow-card hover:bg-farm-50">🧺 Review my cart ({count})</Link>
      </div>
    </div>
  );
}
