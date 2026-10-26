import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import * as authService from '../../services/authService';
import { useToast } from '../../components/common/Toast';

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw.newPassword.length < 6) return setError('New password must be at least 6 characters.');
    setBusy(true);
    try {
      const res = await authService.changePassword(pw.currentPassword, pw.newPassword);
      toast.success(res.message || 'Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-extrabold text-farm-950">Account & Security</h1>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-slate-400">ADMIN NAME</dt><dd className="mt-0.5 font-medium">{user?.name}</dd></div>
          <div><dt className="font-semibold text-slate-400">EMAIL</dt><dd className="mt-0.5 font-medium">{user?.email}</dd></div>
          <div><dt className="font-semibold text-slate-400">ROLE</dt><dd className="mt-0.5 font-medium capitalize">{user?.role}</dd></div>
          <div><dt className="font-semibold text-slate-400">EMAIL VERIFIED</dt><dd className="mt-0.5 font-medium">{user?.isEmailVerified ? '✅ Yes' : '—'}</dd></div>
        </dl>
      </div>

      <form onSubmit={submit} className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="font-extrabold text-farm-950">Change admin password</h2>
        <p className="mt-1 text-sm text-slate-500">Passwords are stored only as bcrypt hashes. Choose a strong password and keep the JWT secret in the backend .env safe.</p>
        <div className="mt-4 space-y-4">
          <div><label className="text-sm font-medium">Current password</label>
            <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" /></div>
          <div><label className="text-sm font-medium">New password</label>
            <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" /></div>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        <button disabled={busy} className="mt-4 rounded-lg bg-farm-600 px-5 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60">
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-bold">Security checklist</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Admin permissions are enforced by Express middleware on every protected endpoint — hiding pages is never the security layer.</li>
          <li>New customers must verify their email OTP (via Resend) before they can log in.</li>
          <li>Blocked customers lose access immediately — their tokens are refused and login is rejected.</li>
          <li>Keep real secrets only in backend/.env — never in Git, never in the frontend.</li>
        </ul>
      </div>
    </div>
  );
}
