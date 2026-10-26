import { useState } from 'react';
import * as adminService from '../../services/adminService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { formatDateTime } from '../../utils/format';

export default function ContactRequests() {
  const toast = useToast();
  const [filter, setFilter] = useState('open');
  const { data: items, loading, refetch } = useFetch(() => adminService.getContactRequests(filter || undefined), [filter]);

  const resolve = async (c) => {
    try { await adminService.resolveContactRequest(c.id); toast.success('Marked as resolved'); refetch(); }
    catch (err) { toast.error(err.message); }
  };
  const remove = async (c) => {
    try { await adminService.deleteContactRequest(c.id); toast.success('Request deleted'); refetch(); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Contact Requests</h1>
      <div className="mt-4 flex gap-2">
        {[['open', 'Open'], ['resolved', 'Resolved'], ['', 'All']].map(([value, label]) => (
          <button key={label} onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === value ? 'bg-farm-600 text-white' : 'border border-slate-300 bg-white'}`}>{label}</button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {(items || []).map((c) => (
          <article key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">{c.name || 'Visitor'} <span className="ml-1 text-sm font-normal text-slate-500">{c.email} · {c.mobile}</span></p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${c.status === 'resolved' ? 'bg-farm-100 text-farm-800' : 'bg-amber-100 text-amber-800'}`}>{c.status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{c.message}</p>
            <p className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</p>
            <div className="mt-2 flex gap-2">
              {c.status !== 'resolved' && <button onClick={() => resolve(c)} className="rounded-lg bg-farm-600 px-3 py-1.5 text-xs font-bold text-white">Mark resolved</button>}
              <button onClick={() => remove(c)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
            </div>
          </article>
        ))}
        {!items?.length && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">No contact requests in this view.</p>}
      </div>
    </div>
  );
}
