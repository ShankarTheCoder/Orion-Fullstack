import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Admin-only routes. Note: this is UX only - the backend enforces the admin
// role on every /admin API call with 403.
export default function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace state={{ message: 'Please log in as Admin to continue.' }} />;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-5xl">⛔</p>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-slate-500">This area is restricted to Admin accounts. You are logged in as a customer.</p>
      </div>
    );
  }
  return children;
}
