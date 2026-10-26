import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import * as customerService from '../../services/customerService';
import * as authService from '../../services/authService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import { useToast } from '../../components/common/Toast';
import { isMobile } from '../../utils/validators';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { data, loading } = useFetch(() => customerService.getProfile(), []);
  const [form, setForm] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader />;
  const current = form ?? { name: data?.user?.name || user?.name || '', mobile: data?.user?.mobile || user?.mobile || '' };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    if (!current.name.trim()) return setError('Name cannot be empty.');
    if (!isMobile(current.mobile)) return setError('Enter a 10-digit mobile number.');
    setBusy(true);
    try {
      const updated = await customerService.updateProfile(current);
      setUser((u) => ({ ...u, ...updated }));
      toast.success('Profile updated');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const savePassword = async (e) => {
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
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-farm-900">My Profile</h1>
      <div className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="font-semibold text-slate-400">EMAIL</dt><dd className="mt-0.5 font-medium">{data?.user?.email || user?.email}</dd></div>
          <div><dt className="font-semibold text-slate-400">ROLE</dt><dd className="mt-0.5 font-medium capitalize">{data?.user?.role || user?.role}</dd></div>
          <div><dt className="font-semibold text-slate-400">EMAIL VERIFIED</dt><dd className="mt-0.5 font-medium">{data?.user?.isEmailVerified ? '✅ Yes' : '❌ No'}</dd></div>
        </dl>
        <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="text-sm font-medium">Full name</label>
            <input value={current.name} onChange={(e) => setForm({ ...current, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" /></div>
          <div><label className="text-sm font-medium">Mobile</label>
            <input value={current.mobile} onChange={(e) => setForm({ ...current, mobile: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" /></div>
          <div><button disabled={busy} className="rounded-lg bg-farm-600 px-5 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60">Save profile</button></div>
        </form>
      </div>

      <div className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
        <h2 className="font-extrabold text-farm-900">Change password</h2>
        <form onSubmit={savePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className="text-sm font-medium">Current password</label>
            <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" /></div>
          <div><label className="text-sm font-medium">New password</label>
            <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" /></div>
          <div><button disabled={busy} className="rounded-lg border border-farm-600 px-5 py-2.5 font-semibold text-farm-800 hover:bg-farm-50 disabled:opacity-60">Change password</button></div>
        </form>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      </div>
    </div>
  );
}
