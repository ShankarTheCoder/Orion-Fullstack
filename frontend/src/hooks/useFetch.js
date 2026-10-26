import { useEffect, useState } from 'react';

// Tiny data-fetching hook for pages: runs fn once (and when deps change),
// exposing { data, loading, error, refetch }.
export default function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    fn()
      .then((result) => { if (alive) setData(result); })
      .catch((err) => { if (alive) setError(err.message || 'Something went wrong'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1), setData };
}
