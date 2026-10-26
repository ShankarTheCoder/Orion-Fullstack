import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Customer-only routes. Guests are redirected to Login with a message
// (guests have no cart/orders in this architecture) and admins are sent to
// their own panel.
export default function ProtectedRoute({ children }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ message: 'Please log in as a customer to continue.', from: location.pathname }} />;
  }
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}
