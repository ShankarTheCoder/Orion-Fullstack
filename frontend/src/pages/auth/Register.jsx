import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authService';
import { validateRegister } from '../../utils/validators';
import { useToast } from '../../components/common/Toast';

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateRegister(form);
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await authService.register(form);
      toast.success('Account created — OTP sent to your email');
      // Next step: verify the email with the 6-digit OTP (Resend).
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setServerError(err.message);
      if (err.fields) {
        const fe = {};
        err.fields.forEach((f) => { fe[f.field] = f.message; });
        setErrors(fe);
      }
    } finally { setBusy(false); }
  };

  const input = (k, props = {}) => (
    <input value={form[k]} onChange={set(k)} {...props}
      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" />
  );

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-farm-100 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-extrabold text-farm-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Register as a customer. We will email you a 6-digit OTP to verify your address — you can log in after verifying.</p>
        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <div><label className="text-sm font-medium">Full name</label>{input('name', { placeholder: 'Your name' })}{errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}</div>
          <div><label className="text-sm font-medium">Mobile (10-digit)</label>{input('mobile', { placeholder: '9876543210', inputMode: 'numeric' })}{errors.mobile && <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>}</div>
          <div><label className="text-sm font-medium">Email</label>{input('email', { type: 'email', placeholder: 'you@example.com' })}{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}</div>
          <div><label className="text-sm font-medium">Password</label>{input('password', { type: 'password', placeholder: 'Minimum 6 characters' })}{errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}</div>
          {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{serverError}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-farm-600 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60">
            {busy ? 'Creating account…' : 'Register & send OTP'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-semibold text-farm-700 hover:underline">Log in</Link>
          {' '}· Got an OTP? <Link to="/verify-email" className="font-semibold text-farm-700 hover:underline">Verify email</Link>
        </p>
      </div>
    </div>
  );
}
