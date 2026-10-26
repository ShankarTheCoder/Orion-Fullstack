import { Link } from 'react-router-dom';
import * as productService from '../../services/productService';
import useFetch from '../../hooks/useFetch';

// Horizontally scrollable category tiles (quick-commerce style), fed by the
// real categories API: "All" + one tile per category. With `onSelect` the
// tiles act as filters (Products page); without it they link to the
// category listing (Home page).
const EMOJI_FOR = { Fruits: '🍎', Vegetables: '🥦' };
const emojiFor = (name) => EMOJI_FOR[name] || '🧺';

export default function CategoryStrip({ active = '', onSelect = null }) {
  const { data } = useFetch(() => productService.getCategories(), []);
  // Real categories only — on a fresh store there are none yet, and the
  // strip simply shows the "All" tile on its own.
  const categories = data || [];
  const tiles = [{ name: '', label: 'All', emoji: '🛒' },
    ...categories.map((c) => ({ name: c.name, label: c.name, emoji: c.emoji || emojiFor(c.name) }))];

  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      {tiles.map((t) => {
        const isActive = active === t.name;
        const cls = `flex w-20 shrink-0 flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${
          isActive ? 'border-farm-500 bg-farm-50 shadow-sm' : 'border-farm-100 bg-white hover:border-farm-300'}`;
        const inner = (
          <>
            <span className="text-3xl">{t.emoji}</span>
            <span className={`text-xs font-semibold ${isActive ? 'text-farm-800' : 'text-slate-600'}`}>{t.label}</span>
          </>
        );
        return onSelect ? (
          <button key={t.label} type="button" onClick={() => onSelect(t.name)} className={cls}>{inner}</button>
        ) : (
          <Link key={t.label} to={t.name ? `/products?category=${encodeURIComponent(t.name)}` : '/products'} className={cls}>{inner}</Link>
        );
      })}
    </div>
  );
}
