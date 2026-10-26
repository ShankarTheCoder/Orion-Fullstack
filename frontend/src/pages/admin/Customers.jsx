import { useState } from 'react';
import * as adminService from '../../services/adminService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { formatPrice, formatDate } from '../../utils/format';

export default function Customers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { data, loading, refetch } = useFetch(() => adminService.getCustomers({ search }), [search]);

  const toggleStatus = async (customer) => {
    const next = customer.status === 'blocked' ? 'active' : 'blocked';
    try {
      await adminService.setCustomerStatus(customer.id, next);
      toast.success(`${customer.name} is now ${next}`);
      if (detail?.customer?.id === customer.id) setDetail(null);
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const view = async (customer) => {
    setDetailLoading(true);
    try { setDetail(await adminService.getCustomerDetail(customer.id)); }
    catch (err) { toast.error(err.message); }
    finally { setDetailLoading(false); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Customers</h1>
      <p className="text-sm text-slate-500">Manage registered customers. Blocking is a status toggle — order history is always preserved, and a blocked customer cannot log in.</p>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or mobile…"
        className="mt-4 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-farm-500" />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Orders</th>
            <th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {(data?.items || []).map((c) => (
              <tr key={c.id} className="border-b border-slate-50">
                <td className="px-4 py-3 font-semibold">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.email}<br />{c.mobile}</td>
                <td className="px-4 py-3">{c.orderCount ?? 0}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-farm-100 text-farm-800'}`}>{c.status}</span></td>
                <td className="px-4 py-3">
                  <span className="flex gap-2">
                    <button onClick={() => view(c)} className="rounded-md border border-farm-300 px-2.5 py-1 text-xs font-bold text-farm-800">View</button>
                    <button onClick={() => toggleStatus(c)} className={`rounded-md border px-2.5 py-1 text-xs font-bold ${c.status === 'blocked' ? 'border-farm-300 text-farm-800' : 'border-red-200 text-red-600'}`}>
                      {c.status === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {!data?.items?.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No customers match.</td></tr>}
          </tbody>
        </table>
      </div>

      {(detailLoading || detail) && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          {detailLoading ? <Loader /> : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-farm-950">{detail.customer.name}</h2>
                <button onClick={() => setDetail(null)} className="text-sm font-semibold text-slate-500">Close ✕</button>
              </div>
              <p className="mt-1 text-sm text-slate-500">{detail.customer.email} · {detail.customer.mobile} · Total spent {formatPrice(detail.totalSpent)} across {detail.orders.length} recent order(s)</p>
              <ul className="mt-3 divide-y divide-slate-100">
                {detail.orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                    <span><strong>{o.orderNumber || o.id}</strong> — {o.items.map((i) => `${i.name} × ${i.quantity}`).join(' · ')}</span>
                    <span>{o.status} · {formatPrice(o.total)}</span>
                  </li>
                ))}
                {!detail.orders.length && <li className="py-2 text-sm text-slate-400">This customer has not ordered yet.</li>}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
