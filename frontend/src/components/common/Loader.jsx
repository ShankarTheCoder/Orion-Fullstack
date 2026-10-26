export default function Loader({ text = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-farm-700">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-farm-200 border-t-farm-600" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
