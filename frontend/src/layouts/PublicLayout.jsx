import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import useAuth from '../hooks/useAuth';

// Public shell: storefront navbar + footer (Guest module).
// Services, FAQ, Feedback, Contact, and About are guest user modules.
export default function PublicLayout() {
  const { isCustomer } = useAuth();
  const location = useLocation();

  // Redirect customers away from auth pages to their dashboard
  if (isCustomer) {
    if (location.pathname === '/login' || location.pathname === '/register') {
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
