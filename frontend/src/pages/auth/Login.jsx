import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';

// ONE login page for everyone: customers and the admin sign in through this
// same form (POST /auth/login). The server returns the account's role and we
// redirect by role - admin -> /admin, customer -> customer dashboard.
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notVerified, setNotVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  const redirectFor = (u) => {
    if (u.role === 'admin') navigate('/admin');
    else navigate(location.state?.from || '/customer/dashboard');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotVerified(false); setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      redirectFor(u);
    } catch (err) {
      setError(err.message);
      if (/not verified/i.test(err.message)) setNotVerified(true);
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-farm-100 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-extrabold text-farm-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to shop, track orders and check out. Admins use this same page — you are taken to your dashboard by role.</p>

        {location.state?.message && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{location.state.message}</p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" placeholder="••••••••" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          {notVerified && (
            <Link to="/verify-email" state={{ email }}
              className="block rounded-lg border border-farm-300 px-3 py-2 text-center text-sm font-semibold text-farm-800 hover:bg-farm-50">
              ➜ Verify your email with the OTP
            </Link>
          )}
          <button disabled={busy} className="w-full rounded-lg bg-farm-600 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60">
            {busy ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New to Orion? <Link to="/register" className="font-semibold text-farm-700 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
