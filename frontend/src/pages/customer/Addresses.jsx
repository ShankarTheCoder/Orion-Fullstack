import { useState } from 'react';
import * as customerService from '../../services/customerService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { isMobile, isPincode } from '../../utils/validators';

const EMPTY = { fullName: '', mobile: '', line: '', area: '', city: 'Meerut', pincode: '', label: 'home' };

export default function Addresses() {
  const toast = useToast();
  const { data: addresses, loading, refetch } = useFetch(() => customerService.getAddresses(), []);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim() || !form.line.trim()) return setError('Name and address line are required.');
    if (!isMobile(form.mobile)) return setError('Enter a 10-digit mobile number.');
    if (!isPincode(form.pincode)) return setError('Enter a 6-digit pincode.');
    setBusy(true);
    try {
      if (editingId) await customerService.updateAddress(editingId, form);
      else await customerService.createAddress(form);
      toast.success(editingId ? 'Address updated' : 'Address saved');
      setForm(EMPTY); setEditingId(null); refetch();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    try { await customerService.deleteAddress(id); toast.success('Address deleted'); refetch(); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <Loader />;

  const field = (k, props = {}) => (
    <input value={form[k]} onChange={set(k)} {...props} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" />
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-900">Delivery Addresses</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {(addresses || []).map((a) => (
          <div key={a.id} className="rounded-2xl border border-farm-100 bg-white p-4 shadow-card">
            <p className="flex items-center justify-between font-bold text-slate-800">{a.fullName}
              <span className="rounded-full bg-farm-100 px-2 py-0.5 text-xs font-bold uppercase text-farm-800">{a.label}</span></p>
            <p className="mt-1 text-sm text-slate-600">{a.line}{a.area ? `, ${a.area}` : ''}, {a.city} — {a.pincode}</p>
            <p className="text-sm text-slate-500">📱 {a.mobile}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setForm({ ...EMPTY, ...a }); setEditingId(a.id); }} className="rounded-lg border border-farm-300 px-3 py-1.5 text-sm font-semibold text-farm-800">Edit</button>
              <button onClick={() => remove(a.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600">Delete</button>
            </div>
          </div>
        ))}
        {!addresses?.length && <p className="text-sm text-slate-500">No saved addresses yet — add one below or during checkout.</p>}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
        <h2 className="font-extrabold text-farm-900">{editingId ? 'Edit address' : 'Add a new address'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="text-sm font-medium">Full name</label>{field('fullName')}</div>
          <div><label className="text-sm font-medium">Mobile</label>{field('mobile', { inputMode: 'numeric' })}</div>
          <div className="sm:col-span-2"><label className="text-sm font-medium">Address line</label>{field('line', { placeholder: 'House no, street' })}</div>
          <div><label className="text-sm font-medium">Area</label>{field('area')}</div>
          <div><label className="text-sm font-medium">City</label>{field('city')}</div>
          <div><label className="text-sm font-medium">Pincode</label>{field('pincode', { inputMode: 'numeric' })}</div>
          <div><label className="text-sm font-medium">Label</label>
            <select value={form.label} onChange={set('label')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
              <option value="home">Home</option><option value="work">Work</option><option value="other">Other</option>
            </select></div>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button disabled={busy} className="rounded-lg bg-farm-600 px-5 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60">{editingId ? 'Update address' : 'Save address'}</button>
          {editingId && <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null); }} className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold">Cancel</button>}
        </div>
      </form>
    </div>
  );
}
