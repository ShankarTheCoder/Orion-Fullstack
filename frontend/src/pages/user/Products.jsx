import { useSearchParams } from 'react-router-dom';
import * as productService from '../../services/productService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import ProductCard from '../../components/products/ProductCard';
import CategoryStrip from '../../components/products/CategoryStrip';

const DEAL_LABELS = { deal: 'Deals', dealOfWeek: 'Deals of the Week', bigPack: 'Big Pack', combo: 'Combos', rs30Corner: '₹30 Corner' };

export default function Products() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const deal = params.get('deal') || '';
  const sort = params.get('sort') || '';

  const { data, loading, error } = useFetch(
    () => productService.getProducts({ search, category, deal, sort }),
    [search, category, deal, sort]
  );

  const set = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next);
  };

  const title = deal ? DEAL_LABELS[deal] || 'Deals' : category ? `Fresh ${category}` : search ? `Results for “${search}”` : 'All Products';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Category strip (quick-commerce style) wired to the category filter */}
      <CategoryStrip active={category} onSelect={(name) => set({ category: name })} />
      <h1 className="mt-4 text-2xl font-extrabold text-farm-900 sm:text-3xl">{title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={deal} onChange={(e) => set({ deal: e.target.value })} className="rounded-lg border border-farm-200 bg-white px-3 py-2 text-sm">
          <option value="">All offers</option>
          {Object.entries(DEAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={sort} onChange={(e) => set({ sort: e.target.value })} className="rounded-lg border border-farm-200 bg-white px-3 py-2 text-sm">
          <option value="">Sort: Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name A–Z</option>
          <option value="newest">Newest</option>
        </select>
        <form onSubmit={(e) => { e.preventDefault(); set({ search: e.target.elements.q.value }); }} className="flex overflow-hidden rounded-lg border border-farm-200">
          <input name="q" defaultValue={search} placeholder="Search products…" className="w-44 px-3 py-2 text-sm outline-none" />
          <button className="bg-farm-600 px-3 text-sm font-semibold text-white">Go</button>
        </form>
      </div>

      {loading && <Loader />}
      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {!loading && !error && (
        data?.items?.length ? (
          <>
            <p className="mt-4 text-sm text-slate-500">{data.total} product(s) found</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-3xl border border-farm-100 bg-white px-6 py-12 text-center shadow-card">
            <p className="text-5xl">🧺</p>
            {(search || category || deal) ? (
              <>
                <h2 className="mt-3 text-lg font-extrabold text-farm-900">No products match your filters</h2>
                <p className="mt-1 text-sm text-slate-500">Try a different search or category.</p>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-lg font-extrabold text-farm-900">No products available yet</h2>
                <p className="mt-1 text-sm text-slate-500">Fresh stock is on the way — please check back soon.</p>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}
