import { useState, useCallback, useRef } from 'react';

export function usePagination(fetchFn, { pageSize = 20, initialPage = 0 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(initialPage);
  const mountedRef = useRef(true);

  const fetch = useCallback(async (page = 0, append = false) => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn({ page, pageSize });
      if (mountedRef.current) {
        setData(prev => {
          const raw = append ? [...prev, ...result.data] : result.data;
          const seen = new Set();
          return raw.filter(item => {
            if (!item?.id) return true;
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        });
        pageRef.current = page;
        setTotal(result.count || 0);
        setHasMore(result.hasMore !== false);
        setLoading(false);
        setRefreshing(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Erro ao carregar');
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchFn]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 0;
    await fetch(0, false);
  }, [fetch]);

  const nextPage = useCallback(async () => {
    if (!hasMore || loading) return;
    const next = pageRef.current + 1;
    pageRef.current = next;
    await fetch(next, true);
  }, [hasMore, loading, fetch]);

  const reset = useCallback(async () => {
    pageRef.current = 0;
    setHasMore(true);
    await fetch(0, false);
  }, [fetch]);

  return {
    data,
    loading,
    refreshing,
    hasMore,
    error,
    total,
    fetch,
    refresh,
    nextPage,
    reset,
    pageRef,
  };
}
