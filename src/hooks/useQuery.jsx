import { useState, useEffect, useRef } from 'react';

const cache = new Map();
const pendingFetches = new Map();

export function useQuery(key, fetchFn, { enabled = true, cacheTime = 30000, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cacheKey = JSON.stringify(key);
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const doFetch = async () => {
      if (pendingFetches.has(cacheKey)) {
        const result = await pendingFetches.get(cacheKey);
        if (!cancelled && mountedRef.current) {
          setData(result);
          setLoading(false);
        }
        return;
      }

      const promise = fetchFn().catch(err => {
        pendingFetches.delete(cacheKey);
        throw err;
      });

      pendingFetches.set(cacheKey, promise);

      try {
        const result = await promise;
        pendingFetches.delete(cacheKey);
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        if (!cancelled && mountedRef.current) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        pendingFetches.delete(cacheKey);
        if (!cancelled && mountedRef.current) {
          setError(err.message || 'Erro ao carregar');
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => { cancelled = true; };
  }, [enabled, ...deps]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    const cacheKey = JSON.stringify(key);
    cache.delete(cacheKey);
    try {
      const result = await fetchFn();
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Erro ao recarregar');
        setLoading(false);
      }
    }
  };

  const invalidateCache = (keyPattern) => {
    if (keyPattern) {
      const strKey = JSON.stringify(keyPattern);
      for (const k of cache.keys()) {
        if (k.includes(strKey.slice(1, -1))) cache.delete(k);
      }
    } else {
      cache.clear();
    }
  };

  return { data, loading, error, refetch, invalidateCache };
}

export function clearQueryCache() {
  cache.clear();
  pendingFetches.clear();
}
