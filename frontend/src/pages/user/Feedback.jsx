import { useState } from 'react';
import * as customerService from '../../services/customerService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import RatingStars from '../../components/common/RatingStars';
import { isMobile } from '../../utils/validators';

export default function Feedback() {
  const { data: reviews, loading, refetch } = useFetch(() => customerService.getFeedback({ limit: 50 }), []);
  const [form, setForm] = useState({ name: '', phone: '', rating: 5, comment: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!isMobile(form.phone)) return setError('Enter a 10-digit phone number.');
    if (!form.comment.trim()) return setError('Please write your feedback.');
    setBusy(true);
    try {
      await customerService.submitFeedback(form);
      setDone(true);
      setForm({ name: '', phone: '', rating: 5, comment: '' });
      refetch();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-farm-900">Feedback & Reviews</h1>
      <p className="mt-2 text-slate-600">Tell us how we did — every submission is read by the Orion team.</p>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-farm-100 bg-white p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="text-sm font-medium">Name</label>
            <input value={form.name} onChange={set('name')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" placeholder="Your name" /></div>
          <div><label className="text-sm font-medium">Phone</label>
            <input value={form.phone} onChange={set('phone')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" placeholder="10-digit phone" inputMode="numeric" /></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Rating:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setForm((f) => ({ ...f, rating: n }))}
              className={`text-2xl ${n <= form.rating ? 'text-amber-500' : 'text-slate-300'}`}>★</button>
          ))}
        </div>
        <div><label className="text-sm font-medium">Your feedback</label>
          <textarea value={form.comment} onChange={set('comment')} rows={3} placeholder="How was the quality and delivery?"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-farm-500" /></div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        {done && <p className="rounded-lg bg-farm-50 px-3 py-2 text-sm font-medium text-farm-800">✅ Thank you! Your feedback has been submitted.</p>}
        <button disabled={busy} className="rounded-lg bg-farm-600 px-6 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:opacity-60">
          {busy ? 'Submitting…' : 'Submit feedback'}
        </button>
      </form>

      <h2 className="mt-10 text-xl font-extrabold text-farm-900">What customers say</h2>
      {loading ? <Loader /> : (
        <ul className="mt-4 space-y-3">
          {(reviews || []).map((r) => (
            <li key={r.id} className="rounded-2xl border border-farm-100 bg-white p-4 shadow-card">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-800">
                {r.name} {r.rating && <RatingStars rating={r.rating} />}
                {r.productName && <span className="rounded-full bg-farm-50 px-2 py-0.5 text-xs font-medium text-farm-700">on {r.productName}</span>}
              </p>
              <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
            </li>
          ))}
          {!reviews?.length && <p className="text-sm text-slate-500">No feedback yet — be the first!</p>}
        </ul>
      )}
    </div>
  );
}
