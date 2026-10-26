import * as adminService from '../../services/adminService';
import useFetch from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';
import RatingStars from '../../components/common/RatingStars';
import { useToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/format';

export default function Feedback() {
  const toast = useToast();
  const { data: items, loading, refetch } = useFetch(() => adminService.getAdminFeedback(), []);

  const remove = async (f) => {
    try { await adminService.deleteFeedback(f.id); toast.success('Feedback removed'); refetch(); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-farm-950">Feedback & Reviews</h1>
      <p className="text-sm text-slate-500">Moderate customer feedback and product reviews. Deleting removes the entry everywhere.</p>
      <div className="mt-5 space-y-3">
        {(items || []).map((f) => (
          <article key={f.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {f.name} {f.rating && <RatingStars rating={f.rating} />}
                {f.productName && <span className="rounded-full bg-farm-50 px-2 py-0.5 text-xs font-medium text-farm-700">on {f.productName}</span>}
                <span className="text-xs font-normal text-slate-400">{formatDate(f.createdAt)} · {f.phone}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">{f.comment}</p>
            </div>
            <button onClick={() => remove(f)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
          </article>
        ))}
        {!items?.length && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">No feedback yet.</p>}
      </div>
    </div>
  );
}
