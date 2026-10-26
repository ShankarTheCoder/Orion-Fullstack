import { Link } from 'react-router-dom';

// "Shop by Category" tiles (Home) - big tappable tiles with emoji art,
// one per real category from the API.
export default function CategoryTiles({ categories = [] }) {
  // No categories yet (fresh store) -> the whole section hides gracefully.
  if (!categories.length) return null;
  const tiles = categories;
  const emojiFor = (name) => (name === 'Fruits' ? '🍎' : name === 'Vegetables' ? '🥦' : '🧺');
  const tintFor = (name) => (name === 'Fruits' ? 'bg-red-50' : name === 'Vegetables' ? 'bg-farm-50' : 'bg-amber-50');
  return (
    <section className="mx-auto mt-10 max-w-7xl px-4">
      <h2 className="mb-4 text-xl font-extrabold text-farm-900 sm:text-2xl">Shop by Category</h2>
      <div className="flex flex-wrap gap-4">
        {tiles.map((c) => (
          <Link key={c.id || c.name} to={`/products?category=${encodeURIComponent(c.name)}`}
            className={`flex w-32 flex-col items-center gap-2 rounded-2xl border border-farm-100 p-4 text-center shadow-card transition hover:border-farm-300 sm:w-36 ${tintFor(c.name)}`}>
            <span className="text-5xl">{c.emoji || emojiFor(c.name)}</span>
            <span className="font-bold text-slate-800">Fresh {c.name}</span>
            <span className="text-xs font-semibold text-farm-700">Shop now →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
