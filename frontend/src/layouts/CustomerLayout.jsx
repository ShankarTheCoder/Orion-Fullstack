import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import logo from '../assets/logo-icon.png';

const itemCls = ({ isActive }) =>
  `block rounded-lg px-4 py-2.5 text-sm font-medium ${isActive ? 'bg-farm-500 text-white' : 'text-farm-100 hover:bg-farm-800'}`;

// Customer shell: a proper account panel with the same dark-sidebar pattern
// as the Admin panel (logo + "My Account", module menu, user footer with
// logout). Storefront browsing stays in the PublicLayout; the customer
// modules (dashboard, cart, orders, addresses, profile) live here.
export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const doLogout = async () => { await logout(); navigate('/login'); };

  const cartBadge = count > 0 && (
    <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
  );

  const menu = [
    ['/customer/dashboard', '📊 Dashboard'],
    ['/products', '🛒 Shop Products'],
    ['/cart', '🧺 My Cart', cartBadge],
    ['/customer/orders', '📦 My Orders'],
    ['/customer/addresses', '📍 My Addresses'],
    ['/customer/profile', '👤 My Profile'],
    ['/feedback', '💬 Feedback'],
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-farm-950 p-4 md:flex">
        <div className="flex items-center gap-2 px-2">
          <img src={logo} alt="Orion" className="h-8 w-8 rounded-lg" />
          <p className="text-lg font-extrabold text-white">Or<span className="text-amber-400">ion</span></p>
        </div>
        <p className="px-2 pb-4 text-xs font-semibold uppercase tracking-wider text-farm-300">My Account</p>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {menu.map(([to, label, badge]) => (
            <NavLink key={to} to={to} end={to === '/customer/dashboard'} className={itemCls}>{label}{badge}</NavLink>
          ))}
        </nav>
        <div className="border-t border-farm-800 pt-3">
          <p className="px-2 text-sm text-farm-200">{user?.name} · CUSTOMER</p>
          {user?.email && <p className="truncate px-2 text-xs text-farm-300">{user.email}</p>}
          <button onClick={doLogout} className="mt-2 w-full rounded-lg border border-farm-700 px-3 py-2 text-sm font-medium text-white hover:bg-farm-800">Logout</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between bg-farm-950 px-4 py-3 text-white md:hidden">
          <span className="flex items-center gap-2 font-extrabold"><img src={logo} alt="Orion" className="h-6 w-6 rounded-md" /> My Account</span>
          <button onClick={doLogout} className="rounded-lg border border-farm-700 px-3 py-1.5 text-sm">Logout</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto bg-farm-900 px-3 py-2 md:hidden">
          {[['/customer/dashboard', 'Dashboard'], ['/products', 'Shop'], ['/cart', 'Cart'], ['/customer/orders', 'Orders'], ['/customer/addresses', 'Addresses'], ['/customer/profile', 'Profile'], ['/feedback', 'Feedback']].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/customer/dashboard'} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-farm-500 text-white' : 'text-farm-100'}`}>{label}</NavLink>
          ))}
        </nav>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
