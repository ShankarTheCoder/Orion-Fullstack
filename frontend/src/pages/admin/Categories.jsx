import { useState } from 'react';
import * as productService from '../../services/productService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';

export default function Categories() {
  const toast = useToast();
  const { data: categories, loading, refetch } = useFetch(() => productService.getAllCategoriesAdmin(), []);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (editingId) { await productService.updateCategory(editingId, form); toast.success('Category updated'); }
      else { await productService.createCategory(form); toast.success('Category created'); }
      setForm({ name: '', description: '' }); setEditingId(null); refetch();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (c) => {
    try {
      const res = await productService.deleteCategory(c.id);
      toast.success(res.message || 'Category removed');
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Categories</h1>
      <form onSubmit={submit} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="min-w-48 flex-1"><label className="text-xs font-semibold">Category name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-farm-500" placeholder="e.g. Fruits" /></div>
        <div className="min-w-48 flex-1"><label className="text-xs font-semibold">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-farm-500" /></div>
        <button disabled={busy} className="rounded-lg bg-farm-600 px-5 py-2 text-sm font-bold text-white hover:bg-farm-700 disabled:opacity-60">{editingId ? 'Update' : 'Add category'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', description: '' }); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button>}
      </form>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(categories || []).map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="flex items-center justify-between font-extrabold text-slate-800">{c.name}
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.isActive ? 'bg-farm-100 text-farm-800' : 'bg-red-100 text-red-700'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></p>
            <p className="mt-1 text-sm text-slate-500">{c.description || '—'}</p>
            <p className="text-xs text-slate-400">slug: {c.slug}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setForm({ name: c.name, description: c.description || '' }); setEditingId(c.id); }} className="rounded-md border border-farm-300 px-3 py-1.5 text-xs font-bold text-farm-800">Edit</button>
              <button onClick={() => remove(c)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete / Deactivate</button>
            </div>
          </div>
        ))}
        {!categories?.length && <p className="text-sm text-slate-500">No categories yet.</p>}
      </div>
      <p className="mt-4 text-xs text-slate-400">Note: a category that still has products is deactivated instead of deleted, so order history is never orphaned.</p>
    </div>
  );
}
