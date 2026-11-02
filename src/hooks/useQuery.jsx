import { useState, useEffect, useRef } from 'react';

const cache = new Map();
const pendingFetches = new Map();

const DEFAULT_STALE_TIME = 300000;

export function useQuery(key, fetchFn, { enabled = true, cacheTime = DEFAULT_STALE_TIME, staleTime, deps = [] } = {}) {
  const ttl = staleTime ?? cacheTime;
  const cacheKey = JSON.stringify(key);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(() => !cache.has(cacheKey));
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const executedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cached = cache.get(cacheKey);

    if (cached) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      if (Date.now() - cached.timestamp > ttl) {
        runFetch({ showLoading: false, force: true });
      }
      return;
    }

    if (!executedRef.current) {
      executedRef.current = true;
      runFetch({ showLoading: true, force: false });
    }

    return () => {};
  }, [cacheKey, enabled]);

  async function runFetch({ showLoading, force }) {
    if (pendingFetches.has(cacheKey)) {
      let pendingResult;
      try {
        pendingResult = await pendingFetches.get(cacheKey);
      } catch (err) {
        if (mountedRef.current && showLoading) {
          setError(err?.message || 'Erro ao carregar');
          setLoading(false);
        }
        return;
      }
      if (mountedRef.current) {
        setData(pendingResult);
        if (showLoading) setLoading(false);
      }
      return;
    }

    if (force) cache.delete(cacheKey);
    if (showLoading) {
      setError(null);
      setLoading(true);
    }

    const promise = fetchFnRef.current().catch(err => {
      pendingFetches.delete(cacheKey);
      throw err;
    });
    pendingFetches.set(cacheKey, promise);

    try {
      const result = await promise;
      pendingFetches.delete(cacheKey);
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      if (mountedRef.current) {
        setData(result);
        if (showLoading) {
          setError(null);
          setLoading(false);
        }
      }
    } catch (err) {
      pendingFetches.delete(cacheKey);
      if (mountedRef.current && showLoading) {
        setError(err?.message || 'Erro ao carregar');
        setLoading(false);
      }
    }
  }

  const refetch = async ({ silent = false } = {}) => {
    if (mountedRef.current && !silent && !cache.has(cacheKey)) {
      setError(null);
      setLoading(true);
    }
    try {
      const result = await runFetch({ showLoading: false, force: true });
      return result;
    } catch (err) {
      if (mountedRef.current && !silent) {
        setError(err?.message || 'Erro ao recarregar');
      }
      return undefined;
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
