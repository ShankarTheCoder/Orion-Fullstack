import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import { formatPrice } from '../utils/format';
import logo from '../assets/logo-icon.png';

const itemCls = ({ isActive }) =>
  `block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-farm-600 text-white shadow-sm' : 'text-farm-100 hover:bg-farm-900/80 hover:text-white'}`;

// Customer Console: the customer's own dedicated platform (sidebar + console top bar).
// All customer modules (dashboard, shop produce, cart, orders, addresses, profile,
// feedback, contact, services) open inside their own panel, never falling back to
// the guest storefront layout.
export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { cart, count } = useCart();
  const navigate = useNavigate();
  const doLogout = async () => { await logout(); navigate('/login'); };

  const cartBadge = count > 0 && (
    <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">{count}</span>
  );

  const menu = [
    ['/customer/dashboard', '📊 Dashboard'],
    ['/customer/products', '🥦 Shop Produce'],
    ['/customer/cart', '🧺 My Cart', cartBadge],
    ['/customer/orders', '📦 My Orders'],
    ['/customer/addresses', '📍 My Addresses'],
    ['/customer/profile', '👤 My Profile'],
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      {/* Left Sidebar (Desktop Console) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-farm-950 p-4 md:flex border-r border-farm-900 shadow-xl">
        <div className="flex items-center gap-2.5 px-2 pt-1 pb-3">
          <img src={logo} alt="Orion" className="h-8 w-8 rounded-lg shadow-sm" />
          <div>
            <p className="text-lg font-extrabold text-white leading-none">Or<span className="text-amber-400">ion</span></p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-farm-300">Customer Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pt-2">
          {menu.map(([to, label, badge]) => (
            <NavLink key={to} to={to} end={to === '/customer/dashboard'} className={itemCls}>
              <span className="flex items-center justify-between">
                <span>{label}</span>
                {badge}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-farm-800/80 pt-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-farm-800 text-sm font-bold text-farm-200">
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{user?.name}</p>
              <p className="truncate text-xs text-farm-300">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={doLogout}
            className="mt-3 w-full rounded-xl border border-farm-700/80 bg-farm-900/60 px-3 py-2 text-xs font-semibold text-white transition hover:bg-farm-800"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Console Content */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Top Console Bar (Desktop & Mobile) */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-xs backdrop-blur sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-farm-950 sm:text-base">
              Customer Console
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/customer/cart"
              className="flex items-center gap-1.5 rounded-xl bg-farm-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-farm-700"
            >
              <span>🛒</span>
              <span>{count} item{count !== 1 ? 's' : ''}</span>
              {count > 0 && <span className="hidden sm:inline">· {formatPrice(cart.subtotal)}</span>}
            </Link>

            <button
              onClick={doLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Navigation Tabs */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-farm-800 bg-farm-950 px-3 py-2 md:hidden">
          {menu.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/customer/dashboard'}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-farm-500 text-white' : 'text-farm-200 hover:bg-farm-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
