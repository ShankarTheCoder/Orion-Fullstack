import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';

// Public shell: storefront navbar + footer (Guest module).
// If a customer is logged in, any navigation to public modules automatically
// routes into their dedicated Customer Console panel.
export default function PublicLayout() {
  const { user, isCustomer } = useAuth();
  const { count } = useCart();
  const location = useLocation();

  // Redirect customers into their own platform/console panel
  if (isCustomer) {
    if (location.pathname === '/feedback') return <Navigate to="/customer/feedback" replace />;
    if (location.pathname === '/products') return <Navigate to={`/customer/products${location.search}`} replace />;
    if (location.pathname.startsWith('/products/')) return <Navigate to={`/customer${location.pathname}`} replace />;
    if (location.pathname === '/contact') return <Navigate to="/customer/contact" replace />;
    if (location.pathname === '/services') return <Navigate to="/customer/services" replace />;
    if (location.pathname === '/about') return <Navigate to="/customer/about" replace />;
    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {isCustomer && (
        <aside aria-label="Customer Session Bar" className="border-b border-farm-200 bg-gradient-to-r from-farm-50 via-emerald-50 to-farm-50 px-4 py-2 text-xs text-farm-900 shadow-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-farm-600 animate-pulse" />
              <span>Signed in as <strong className="font-bold text-farm-950">{user.name}</strong> <span className="text-farm-600">(Customer)</span></span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold text-farm-800">
              <Link to="/customer/dashboard" className="hover:text-farm-950 hover:underline">📊 My Dashboard</Link>
              <span className="text-farm-300">·</span>
              <Link to="/customer/orders" className="hover:text-farm-950 hover:underline">📦 Orders</Link>
              <span className="text-farm-300">·</span>
              <Link to="/customer/addresses" className="hover:text-farm-950 hover:underline">📍 Addresses</Link>
              <span className="text-farm-300">·</span>
              <Link to="/customer/profile" className="hover:text-farm-950 hover:underline">👤 Profile</Link>
              <span className="text-farm-300">·</span>
              <Link to="/cart" className="hover:text-farm-950 hover:underline">🧺 Cart ({count})</Link>
            </div>
          </div>
        </aside>
      )}
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
