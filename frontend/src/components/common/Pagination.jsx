// Simple client-side pagination control (pages fetch with a high limit and
// slice locally where the API's page count is not needed).
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="rounded-lg border border-farm-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40">← Prev</button>
      <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="rounded-lg border border-farm-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40">Next →</button>
    </div>
  );
}
