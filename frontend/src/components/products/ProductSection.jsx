import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';

// A titled horizontal rail (home page) - or grid when `grid` is set.
export default function ProductSection({ title, subtitle, products = [], viewAllHref, grid = false }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto mt-10 max-w-7xl px-4">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-farm-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {viewAllHref && <Link to={viewAllHref} className="text-sm font-semibold text-farm-700 hover:underline">View all →</Link>}
      </div>
      {grid ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        // Quick-commerce shelf: a horizontal-scrolling rail at every size.
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {products.map((p) => (
            <div key={p.id} className="w-44 shrink-0 snap-start sm:w-48"><ProductCard product={p} /></div>
          ))}
        </div>
      )}
    </section>
  );
}
