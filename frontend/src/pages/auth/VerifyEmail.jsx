import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authService';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import { isOtp } from '../../utils/validators';

const COOLDOWN_SECONDS = 60;

// Email OTP verification screen (Resend). Reached right after Register, or
// from Login when an unverified account tries to log in. Verifying logs the
// user in and sends them to their Customer Dashboard.
export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { adoptSession } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef(null);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timer.current), []);

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    if (!isOtp(otp)) { setError('Enter the 6-digit OTP from your email.'); return; }
    setBusy(true);
    try {
      const { user } = await authService.verifyEmail(email.trim(), otp.trim());
      adoptSession(user);
      toast.success('Email verified — welcome to Orion!');
      navigate('/customer/dashboard');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setResending(true);
    try {
      const message = await authService.resendOtp(email.trim());
      toast.info(message || 'A new OTP has been sent');
      startCooldown();
    } catch (err) {
      setError(err.message);
      if (err.status === 429) startCooldown();
    } finally { setResending(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-farm-100 bg-white p-6 shadow-card">
        <p className="text-4xl">✉️</p>
        <h1 className="mt-2 text-2xl font-extrabold text-farm-900">Verify your email</h1>
        <p className="mt-1 text-sm text-slate-500">
          We sent a 6-digit OTP to <strong className="text-slate-700">{email || 'your email'}</strong>.
          It is valid for <strong>10 minutes</strong>. Enter it below to activate your account.
        </p>

        <form onSubmit={verify} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">6-digit OTP</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" autoComplete="one-time-code" placeholder="••••••"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-farm-500" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-farm-600 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60">
            {busy ? 'Verifying…' : 'Verify & log in'}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-4 text-center">
          <p className="text-sm text-slate-500">Didn't get the email? Check spam, or</p>
          <button onClick={resend} disabled={cooldown > 0 || resending || !email}
            className="mt-2 rounded-lg border border-farm-300 px-4 py-2 text-sm font-semibold text-farm-800 hover:bg-farm-50 disabled:cursor-not-allowed disabled:opacity-50">
            {resending ? 'Sending…' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </button>
          <p className="mt-3 text-xs text-slate-400">A fresh OTP invalidates the previous one. In local dev mode (no Resend key) the OTP is printed in the backend console.</p>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Wrong account? <Link to="/login" className="font-semibold text-farm-700 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
