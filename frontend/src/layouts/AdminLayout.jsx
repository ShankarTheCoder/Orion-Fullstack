import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import logo from '../assets/logo-icon.png';

const itemCls = ({ isActive }) =>
  `block rounded-lg px-4 py-2.5 text-sm font-medium ${isActive ? 'bg-farm-500 text-white' : 'text-farm-100 hover:bg-farm-800'}`;

// Admin shell: dark sidebar, completely separate from the storefront.
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = async () => { await logout(); navigate('/login'); };
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-farm-950 p-4 md:flex">
        <div className="flex items-center gap-2 px-2">
          <img src={logo} alt="Orion" className="h-8 w-8 rounded-lg" />
          <p className="text-lg font-extrabold text-white">Or<span className="text-amber-400">ion</span></p>
        </div>
        <p className="px-2 pb-4 text-xs font-semibold uppercase tracking-wider text-farm-300">Admin Panel</p>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <NavLink to="/admin" end className={itemCls}>📊 Dashboard</NavLink>
          <NavLink to="/admin/products" className={itemCls}>🥦 Products & Stock</NavLink>
          <NavLink to="/admin/categories" className={itemCls}>🗂️ Categories</NavLink>
          <NavLink to="/admin/orders" className={itemCls}>📦 Orders</NavLink>
          <NavLink to="/admin/customers" className={itemCls}>👥 Customers</NavLink>
          <NavLink to="/admin/payments" className={itemCls}>💳 Payments</NavLink>
          <NavLink to="/admin/feedback" className={itemCls}>⭐ Feedback</NavLink>
          <NavLink to="/admin/contact-requests" className={itemCls}>✉️ Contact Requests</NavLink>
          <NavLink to="/admin/settings" className={itemCls}>🔐 Account & Security</NavLink>
        </nav>
        <div className="border-t border-farm-800 pt-3">
          <p className="px-2 text-sm text-farm-200">{user?.name} · ADMIN</p>
          <button onClick={doLogout} className="mt-2 w-full rounded-lg border border-farm-700 px-3 py-2 text-sm font-medium text-white hover:bg-farm-800">Logout</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between bg-farm-950 px-4 py-3 text-white md:hidden">
          <span className="flex items-center gap-2 font-extrabold"><img src={logo} alt="Orion" className="h-6 w-6 rounded-md" /> Admin Panel</span>
          <button onClick={doLogout} className="rounded-lg border border-farm-700 px-3 py-1.5 text-sm">Logout</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto bg-farm-900 px-3 py-2 md:hidden">
          {[['/admin', 'Dashboard'], ['/admin/products', 'Products'], ['/admin/categories', 'Categories'], ['/admin/orders', 'Orders'], ['/admin/customers', 'Customers'], ['/admin/payments', 'Payments'], ['/admin/feedback', 'Feedback'], ['/admin/contact-requests', 'Contacts'], ['/admin/settings', 'Security']].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-farm-500 text-white' : 'text-farm-100'}`}>{label}</NavLink>
          ))}
        </nav>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
