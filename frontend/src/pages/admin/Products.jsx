import { useMemo, useState } from 'react';
import * as productService from '../../services/productService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { formatPrice } from '../../utils/format';
import { productImageSrc } from '../../utils/image';

const MAX_IMAGE_MB = 5;

const EMPTY = { name: '', categoryName: 'Fruits', price: '', unit: 'kg', stock: '', emoji: '', imageUrl: '', description: '', dealFlags: [] };
const FLAG_OPTIONS = ['deal', 'dealOfWeek', 'bigPack', 'combo', 'rs30Corner'];

export default function Products() {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(async () => {
    const res = await productService.getProducts({ limit: 100, all: 'true' });
    return res.items;
  }, []);
  const { data: categories } = useFetch(() => productService.getCategories(), []);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [stockEdits, setStockEdits] = useState({});
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState(null); // newly picked file, uploaded on save
  const [imagePreview, setImagePreview] = useState(''); // preview src (object URL or existing image)
  const [imageError, setImageError] = useState('');

  const onImageSelect = (e) => {
    const file = e.target.files?.[0];
    setImageError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImageError('Please choose an image file (jpg, png, webp or gif).'); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setImageError(`Image must be up to ${MAX_IMAGE_MB} MB (this file is ${(file.size / 1048576).toFixed(1)} MB).`); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => { setForm(EMPTY); setEditingId(null); setImageFile(null); setImagePreview(''); setImageError(''); };

  const items = useMemo(() => (data || []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [data, search]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      name: form.name, categoryName: form.categoryName, price: Number(form.price),
      unit: form.unit, stock: Number(form.stock || 0), emoji: form.emoji,
      imageUrl: form.imageUrl, description: form.description, dealFlags: form.dealFlags,
    };
    if (!payload.name || Number.isNaN(payload.price) || payload.price < 0) return setFormError('Name and a valid price are required.');
    if (imageError) return setFormError(imageError);
    setBusy(true);
    try {
      // Upload the picked image first; if the upload fails we stop here and
      // show the server's message instead of saving a broken image.
      if (imageFile) payload.imageUrl = await productService.uploadProductImage(imageFile);
      if (editingId) { await productService.updateProduct(editingId, payload); toast.success('Product updated'); }
      else { await productService.createProduct(payload); toast.success('Product added'); }
      resetForm(); refetch();
    } catch (err) { setFormError(err.message); }
    finally { setBusy(false); }
  };

  const toggleFlag = (flag) => setForm((f) => ({ ...f, dealFlags: f.dealFlags.includes(flag) ? f.dealFlags.filter((x) => x !== flag) : [...f.dealFlags, flag] }));

  const saveStock = async (p) => {
    const value = Number(stockEdits[p.id]);
    if (Number.isNaN(value) || value < 0) return toast.error('Enter a valid stock number');
    try { await productService.updateStock(p.id, value); toast.success(`Stock updated for ${p.name}`); refetch(); }
    catch (err) { toast.error(err.message); }
  };

  const deactivate = async (p) => {
    try { await productService.deleteProduct(p.id); toast.success(`${p.name} deactivated`); refetch(); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <Loader />;

  const field = (k, props = {}) => (
    <input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} {...props}
      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-farm-500" />
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Products & Stock</h1>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <form onSubmit={submit} className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="font-extrabold text-farm-950">{editingId ? 'Edit product' : 'Add a new product'}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div><label className="text-xs font-semibold">Name</label>{field('name')}</div>
          <div><label className="text-xs font-semibold">Category</label>
            <select value={form.categoryName} onChange={(e) => setForm((f) => ({ ...f, categoryName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {(categories || []).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select></div>
          <div><label className="text-xs font-semibold">Price (₹)</label>{field('price', { type: 'number', min: 0, step: 'any' })}</div>
          <div><label className="text-xs font-semibold">Unit</label>
            <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {['kg', 'dozen', 'piece', 'bunch', 'litre'].map((u) => <option key={u}>{u}</option>)}
            </select></div>
          <div><label className="text-xs font-semibold">Stock</label>{field('stock', { type: 'number', min: 0 })}</div>
          <div><label className="text-xs font-semibold">Emoji (fallback)</label>{field('emoji', { placeholder: '🥭' })}</div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold">Product image (upload, max {MAX_IMAGE_MB} MB)</label>
            <div className="mt-1 flex items-start gap-3">
              {imagePreview
                ? <img src={imagePreview} alt="Product preview" className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover" />
                : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-farm-50 text-4xl">{form.emoji || '🥬'}</div>}
              <div className="min-w-0">
                <input type="file" accept="image/*" onChange={onImageSelect}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-farm-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-farm-700" />
                {imageFile && <p className="mt-1 truncate text-xs text-slate-500">{imageFile.name} · {(imageFile.size / 1024).toFixed(0)} KB — will upload on save</p>}
                {!imageFile && form.imageUrl && <p className="mt-1 truncate text-xs text-slate-500">Current image: {form.imageUrl}</p>}
                <p className="mt-1 text-xs text-slate-400">Images only (jpg, png, webp, gif), up to {MAX_IMAGE_MB} MB. Leave empty to keep the emoji.</p>
                {imageError && <p className="mt-1 text-xs font-semibold text-red-600">{imageError}</p>}
              </div>
            </div>
          </div>
          <div><label className="text-xs font-semibold">Description</label>{field('description')}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FLAG_OPTIONS.map((flag) => (
            <button type="button" key={flag} onClick={() => toggleFlag(flag)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${form.dealFlags.includes(flag) ? 'bg-farm-600 text-white' : 'border border-slate-300 text-slate-600'}`}>{flag}</button>
          ))}
        </div>
        {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{formError}</p>}
        <div className="mt-4 flex gap-2">
          <button disabled={busy} className="rounded-lg bg-farm-600 px-5 py-2 text-sm font-bold text-white hover:bg-farm-700 disabled:opacity-60">{busy ? 'Saving…' : editingId ? 'Update product' : 'Add product'}</button>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold">Cancel edit</button>}
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
          <h2 className="font-extrabold text-farm-950">All products ({items.length})</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-farm-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2">Product</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Stock</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Actions</th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-4 py-2.5 font-medium">{p.emoji} {p.name}</td>
                  <td className="px-4 py-2.5">{p.category}</td>
                  <td className="px-4 py-2.5">{formatPrice(p.price)}/{p.unit}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1">
                      <input type="number" min="0" defaultValue={p.stock} onChange={(e) => setStockEdits((s) => ({ ...s, [p.id]: e.target.value }))}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                      <button onClick={() => saveStock(p)} className="rounded-md bg-farm-100 px-2 py-1 text-xs font-bold text-farm-800">Set</button>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{p.isActive === false ? <span className="text-red-600 font-semibold">Inactive</span> : p.stock <= 0 ? <span className="text-red-600 font-semibold">Out of stock</span> : <span className="text-farm-700 font-semibold">Live</span>}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex gap-2">
                      <button onClick={() => { const np = { ...EMPTY, ...p, categoryName: p.category, price: String(p.price), stock: String(p.stock) }; setForm(np); setEditingId(p.id); setImageFile(null); setImageError(''); setImagePreview(productImageSrc(np)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="rounded-md border border-farm-300 px-2.5 py-1 text-xs font-bold text-farm-800">Edit</button>
                      {p.isActive !== false && <button onClick={() => deactivate(p)} className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600">Deactivate</button>}
                    </span>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
