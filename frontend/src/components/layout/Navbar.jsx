import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { formatPrice } from '../../utils/format';
import logoFull from '../../assets/logo-full.png';

const linkCls = ({ isActive }) =>
  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-farm-600 text-white' : 'text-slate-700 hover:bg-farm-100'}`;

// Quick-commerce style storefront header (Zepto/Blinkit pattern):
// logo + delivery block + wide search on the main bar, a slim links row
// underneath, and a prominent GREEN cart button (count + item total) for
// customers. Guests get Login + a cart button that routes to /login.
export default function Navbar() {
  const { user, isAdmin, isCustomer, logout } = useAuth();
  const { cart, count } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const doSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : '/products');
  };

  const doLogout = async () => { await logout(); navigate('/'); };

  return (
    <header className="sticky top-0 z-50 border-b border-farm-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logoFull} alt="Orion" className="h-10 w-auto" />
        </Link>

        {/* Delivery block (quick-commerce style) — only for signed-in users;
            guests do not see a delivery location. */}
        {user && (
          <div className="hidden leading-tight lg:block">
            <p className="text-[15px] font-extrabold text-slate-900">Delivery in Meerut</p>
            <p className="max-w-44 truncate text-xs text-slate-500">Home — Meerut, Uttar Pradesh ⌄</p>
          </div>
        )}

        <form onSubmit={doSearch} className="relative order-3 w-full sm:order-2 sm:w-auto sm:flex-1 sm:max-w-xl sm:mx-auto">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fruits, vegetables & more…"
            className="w-full rounded-xl border border-farm-100 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-farm-400 focus:bg-white" />
        </form>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0">
          {!user && (
            <>
              <Link to="/login" className="px-2 py-2 text-sm font-semibold text-slate-800 hover:text-farm-700">Login</Link>
              <Link to="/register" className="hidden px-2 py-2 text-sm font-semibold text-slate-800 hover:text-farm-700 md:block">Register</Link>
              {/* Guests have no cart: the cart button takes them to Login. */}
              <Link to="/login" className="rounded-xl bg-farm-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-farm-700">🛒 Cart</Link>
            </>
          )}
          {isCustomer && (
            <>
              <Link to="/customer/dashboard" className="hidden rounded-full bg-farm-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-farm-800 md:block">
                {user.name?.split(' ')[0]} · {user.role}
              </Link>
              <Link to="/cart" className="rounded-xl bg-farm-600 px-4 py-2 text-center leading-tight text-white shadow-sm hover:bg-farm-700">
                {count > 0 ? (
                  <>
                    <span className="block text-sm font-extrabold">🛒 {count} item{count > 1 ? 's' : ''}</span>
                    <span className="block text-[11px] font-semibold text-farm-100">{formatPrice(cart.subtotal)}</span>
                  </>
                ) : <span className="block px-1 py-0.5 text-sm font-extrabold">🛒 My Cart</span>}
              </Link>
              <button onClick={doLogout} className="hidden rounded-lg border border-farm-300 px-3 py-2 text-sm font-medium text-farm-800 hover:bg-farm-50 md:block">Logout</button>
            </>
          )}
          {isAdmin && (
            <>
              <span className="hidden rounded-full bg-farm-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-farm-800 md:block">
                {user.name?.split(' ')[0]} · {user.role}
              </span>
              <Link to="/admin" className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">Admin Panel</Link>
              <button onClick={doLogout} className="hidden rounded-lg border border-farm-300 px-3 py-2 text-sm font-medium text-farm-800 hover:bg-farm-50 md:block">Logout</button>
            </>
          )}
        </div>
      </div>

      {/* Slim links row */}
      <nav className="border-t border-slate-100">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5">
          {!isAdmin && <>
            <NavLink to="/" className={linkCls}>Home</NavLink>
            <NavLink to="/products" className={linkCls}>Products</NavLink>
            <NavLink to="/services" className={linkCls}>Services</NavLink>
            <NavLink to="/about" className={linkCls}>About</NavLink>
            <NavLink to="/contact" className={linkCls}>Contact</NavLink>
          </>}
          {isCustomer && <>
            <NavLink to="/customer/orders" className={linkCls}>My Orders</NavLink>
            <NavLink to="/customer/dashboard" className={linkCls}>My Account</NavLink>
          </>}
          {isAdmin && <NavLink to="/admin" className={linkCls}>Admin Panel</NavLink>}
          {user && (
            <button onClick={doLogout} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-farm-100 md:hidden">Logout</button>
          )}
        </div>
      </nav>
    </header>
  );
}
