import * as productService from '../../services/productService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import ProductSection from '../../components/products/ProductSection';
import CategoryTiles from '../../components/products/CategoryTiles';
import CategoryStrip from '../../components/products/CategoryStrip';

// Quick-commerce style home (Zepto/Blinkit pattern), fruits & vegetables
// only: category strip, Shop by Category tiles, product shelves grouped
// by category, then the full catalogue grid. (The hero banner was removed
// at the owner's request; Home now starts with the category tiles.)
export default function Home() {
  const { data, loading, error } = useFetch(async () => {
    const [all, categories] = await Promise.all([
      productService.getProducts({ limit: 100 }),
      productService.getCategories(),
    ]);
    return { products: all.items, categories };
  }, []);

  const products = data?.products || [];
  const categories = data?.categories || [];
  const byFlag = (flag) => products.filter((p) => p.dealFlags?.includes(flag));
  const byCategory = (name) => products.filter((p) => p.category === name);

  return (
    <div>
      {/* Category strip right under the header */}
      <div className="mx-auto max-w-7xl px-4 pt-3">
        <CategoryStrip />
      </div>

      {loading && <Loader text="Loading fresh products…" />}
      {error && <p className="mx-auto mt-8 max-w-xl rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">Couldn't reach the server. Please check your connection and try again.</p>}

      {!loading && !error && products.length === 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-4 pb-12">
          <div className="rounded-3xl border border-farm-100 bg-white px-6 py-12 text-center shadow-card">
            <p className="text-5xl">🌱</p>
            <h2 className="mt-3 text-xl font-extrabold text-farm-900">Fresh products are on the way</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Our shelves are being stocked with farm-fresh fruits &amp; vegetables — please check back soon.</p>
          </div>
        </section>
      )}

      {!loading && !error && products.length > 0 && <>
        <CategoryTiles categories={categories} />
        <ProductSection title="🔥 Deals of the Week" products={byFlag('dealOfWeek')} viewAllHref="/products?deal=dealOfWeek" />
        {categories.map((c) => (
          <ProductSection key={c.id || c.name}
            title={c.name === 'Fruits' ? '🍎 Fresh Fruits' : c.name === 'Vegetables' ? '🥦 Fresh Vegetables' : c.name}
            products={byCategory(c.name).slice(0, 12)}
            viewAllHref={`/products?category=${encodeURIComponent(c.name)}`} />
        ))}
        <ProductSection title="🎁 Big Packs & Combos" products={products.filter((p) => p.dealFlags?.some((f) => ['bigPack', 'combo'].includes(f)))} viewAllHref="/products?deal=bigPack" />
        <ProductSection title="🪙 ₹30 Corner" subtitle="Everyday sabzi at ₹30 or less" products={products.filter((p) => p.price <= 30)} viewAllHref="/products?deal=rs30Corner" />
        <ProductSection title="All Products" subtitle="The full fruits & vegetables catalogue" products={products} viewAllHref="/products" grid />
        <div className="pb-12" />
      </>}
    </div>
  );
}
