import { Link, useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import { formatPrice } from '../../utils/format';
import { productImageSrc } from '../../utils/image';

// Quick-commerce style product card (Zepto/Blinkit pattern):
// image on top, name (2 lines), pack/unit label, price row with an ADD
// button that turns into a green - qty + stepper once the item is in the
// customer's server cart. GUESTS see basic info only (image, name,
// category, price/unit - no stock) and a "Login to Order" action.
// NOTE: the catalogue has no MRP field, so there is deliberately no
// discount badge or struck-through price - we never invent price data.
const itemIdOf = (i) => i.productId || i.product?.id || i.product?._id
  || (typeof i.product === 'string' ? i.product : null);

export default function ProductCard({ product }) {
  const { cart, add, update, remove, busy } = useCart();
  const { user, isCustomer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const out = product.stock <= 0;

  const item = isCustomer ? cart.items.find((i) => itemIdOf(i) === product.id) : null;
  const qty = item?.quantity || 0;

  const onAdd = async () => {
    if (!user) {
      // Guests have NO cart in this architecture - send them to log in first.
      toast.info('Please log in as a customer to use the cart');
      navigate('/login', { state: { message: 'Log in to add items to your cart. Guests can browse, but the cart is for registered customers.' } });
      return;
    }
    try {
      const res = await add(product.id, 1);
      if (res?.needsLogin) { navigate('/login'); return; }
      if (res?.blocked) { toast.error('Admins do not shop - log in as a customer to order'); return; }
      toast.success(`${product.name} added to cart`);
    } catch (err) { toast.error(err.message); }
  };

  const step = async (delta) => {
    const next = qty + delta;
    try {
      if (next < 1) await remove(product.id);
      else await update(product.id, next);
    } catch (err) { toast.error(err.message); }
  };

  const img = productImageSrc(product);

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-farm-100 bg-white p-3 shadow-card">
      <Link to={`/products/${product.id}`} className="block">
        <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-farm-50">
          {img
            ? <img src={img} alt={product.name} className="h-full w-full object-cover" />
            : <span className="text-6xl">{product.emoji || '🥬'}</span>}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-800">{product.name}</h3>
        <p className="text-xs text-slate-400">{product.category}</p>
        <p className="text-xs font-medium text-slate-500">1 {product.unit}</p>
        {/* Stock is a full detail - logged-in users only (guests: basic info). */}
        {user && (
          <p className={`mt-0.5 text-xs font-medium ${out ? 'text-red-500' : 'text-slate-400'}`}>
            {out ? 'Out of stock' : `${product.stock} ${product.unit} in stock`}
          </p>
        )}
      </Link>

      <div className="mt-auto pt-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="font-extrabold leading-tight text-slate-900">{formatPrice(product.price)}</p>
            <p className="text-[11px] leading-tight text-slate-400">per {product.unit}</p>
          </div>
          {user && (qty > 0 ? (
            <div className="flex items-center rounded-lg bg-farm-600 text-white shadow-sm">
              <button disabled={busy} onClick={() => step(-1)} className="px-2.5 py-1.5 font-extrabold disabled:opacity-60" aria-label="Decrease quantity">−</button>
              <span className="w-6 text-center text-sm font-bold">{qty}</span>
              <button disabled={busy} onClick={() => step(1)} className="px-2.5 py-1.5 font-extrabold disabled:opacity-60" aria-label="Increase quantity">+</button>
            </div>
          ) : out ? (
            <button disabled className="cursor-not-allowed rounded-lg bg-slate-200 px-3 py-1.5 text-[13px] font-bold text-slate-500">Out of Stock</button>
          ) : (
            <button disabled={busy} onClick={onAdd}
              className="rounded-lg border-2 border-farm-600 bg-farm-50 px-4 py-1 text-sm font-extrabold text-farm-700 shadow-sm hover:bg-farm-100 disabled:opacity-60">
              ADD
            </button>
          ))}
        </div>
        {!user && (
          <button onClick={onAdd}
            className="mt-2 w-full rounded-lg border-2 border-farm-600 bg-white px-3 py-1.5 text-[13px] font-extrabold text-farm-700 hover:bg-farm-50">
            🔑 Login to Order
          </button>
        )}
      </div>
    </div>
  );
}
