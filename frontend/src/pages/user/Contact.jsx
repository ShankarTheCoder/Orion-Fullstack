import { useState } from 'react';
import * as customerService from '../../services/customerService';
import { isEmail, isMobile } from '../../utils/validators';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isEmail(form.email)) return setError('Enter a valid email address.');
    if (!isMobile(form.mobile)) return setError('Enter a 10-digit mobile number.');
    if (!form.message.trim()) return setError('Please write your message.');
    setBusy(true);
    try {
      await customerService.submitContact(form);
      setDone(true);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const field = (k, props = {}) => (
    <input value={form[k]} onChange={set(k)} {...props} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" />
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-farm-900">Contact Us</h1>
      <p className="mt-2 text-slate-600">Questions about an order, delivery areas or bulk buying? Send us a request — the Orion team (admin) reviews every message.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-farm-100 bg-white p-4 shadow-card"><p className="text-2xl">📍</p><p className="mt-1 font-bold">Meerut, UP</p><p className="text-sm text-slate-500">Delivering across the city</p></div>
        <div className="rounded-2xl border border-farm-100 bg-white p-4 shadow-card"><p className="text-2xl">📧</p><p className="mt-1 font-bold">support@farmpicked.in</p><p className="text-sm text-slate-500">Replies within 24 hours</p></div>
        <div className="rounded-2xl border border-farm-100 bg-white p-4 shadow-card"><p className="text-2xl">🕐</p><p className="mt-1 font-bold">7 AM – 8 PM</p><p className="text-sm text-slate-500">All delivery windows</p></div>
      </div>
      {done ? (
        <div className="mt-8 rounded-2xl border border-farm-200 bg-farm-50 p-6 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 font-bold text-farm-900">Request sent!</p>
          <p className="text-sm text-slate-600">Thank you — our team will get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-farm-100 bg-white p-6 shadow-card">
          <div><label className="text-sm font-medium">Your name</label>{field('name', { placeholder: 'Full name' })}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Email</label>{field('email', { type: 'email', placeholder: 'you@example.com' })}</div>
            <div><label className="text-sm font-medium">Mobile</label>{field('mobile', { placeholder: '10-digit mobile', inputMode: 'numeric' })}</div>
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea value={form.message} onChange={set('message')} rows={4} placeholder="How can we help?"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <button disabled={busy} className="rounded-lg bg-farm-600 px-6 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60">
            {busy ? 'Sending…' : 'Send request'}
          </button>
        </form>
      )}
    </div>
  );
}
