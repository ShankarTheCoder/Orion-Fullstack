import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authService';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import { isOtp } from '../../utils/validators';

const COOLDOWN_SECONDS = 60;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const { adoptSession } = useAuth();

  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
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

  const requestOtp = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email address is required'); return; }
    setError('');
    setBusy(true);
    try {
      const data = await authService.forgotPassword(email.trim());
      toast.success(data.message || 'Password reset OTP sent to your email');
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep(2);
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!isOtp(otp)) { setError('Enter the 6-digit OTP sent to your email.'); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setBusy(true);
    try {
      const { user } = await authService.resetPassword(email.trim(), otp.trim(), newPassword);
      adoptSession(user);
      toast.success(`Password reset successful! Welcome back, ${user.name}`);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/customer/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resending || !email) return;
    setError('');
    setResending(true);
    try {
      const data = await authService.forgotPassword(email.trim());
      toast.info(data.message || 'A fresh reset code has been sent');
      if (data.devOtp) setDevOtp(data.devOtp);
      startCooldown();
    } catch (err) {
      setError(err.message);
      if (err.status === 429) startCooldown();
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-farm-100 bg-white p-6 shadow-card">
        <p className="text-4xl">🔐</p>
        <h1 className="mt-2 text-2xl font-extrabold text-farm-900">
          {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {step === 1
            ? 'Enter your registered email address to receive a 6-digit verification code to reset your password.'
            : `Enter the 6-digit code sent to ${email} and set your new password.`}
        </p>

        {devOtp && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <strong>[DEV MODE OTP]:</strong> Use code <code className="rounded bg-amber-200 px-2 py-0.5 font-bold tracking-widest">{devOtp}</code> to reset without waiting for email.
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={requestOtp} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <button
              disabled={busy}
              className="w-full rounded-lg bg-farm-600 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60"
            >
              {busy ? 'Sending OTP…' : 'Send Reset OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium">6-Digit Reset Code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-farm-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500"
                placeholder="Minimum 6 characters"
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <button
              disabled={busy}
              className="w-full rounded-lg bg-farm-600 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60"
            >
              {busy ? 'Resetting…' : 'Reset Password & Log In'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <p className="text-sm text-slate-500">Didn't get the code? Check spam, or</p>
            <button
              onClick={resend}
              disabled={cooldown > 0 || resending}
              className="mt-2 rounded-lg border border-farm-300 px-4 py-2 text-sm font-semibold text-farm-800 hover:bg-farm-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending ? 'Sending…' : cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Remember your password? <Link to="/login" className="font-semibold text-farm-700 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
