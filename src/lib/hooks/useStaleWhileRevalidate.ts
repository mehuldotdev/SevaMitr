'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SWROptions<T> {
  initialData?: T;
  revalidateOnFocus?: boolean;
  dedupingInterval?: number; // ms, default 5000
  persistKey?: string; // Optional custom key for localStorage
}

interface SWRResponse<T> {
  data: T;
  error: Error | null;
  isValidating: boolean;
  mutate: (newData?: T | ((current: T) => T), shouldRevalidate?: boolean) => Promise<void>;
}

// Global in-memory cache map
const memoryCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Custom Stale-While-Revalidate (SWR) Hook
 * 1. Serves stale data immediately from memory or localStorage (0ms latency, zero layout shift)
 * 2. Triggers an asynchronous network revalidation in the background
 * 3. Seamlessly updates React state if fresh data differs from the cached version
 * 4. Automatically revalidates on window focus / tab switch
 */
export function useStaleWhileRevalidate<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: SWROptions<T> = {}
): SWRResponse<T> {
  const {
    initialData,
    revalidateOnFocus = true,
    dedupingInterval = 5000,
    persistKey,
  } = options;

  const storageKey = persistKey || (key ? `swr_cache_${key}` : null);

  // Helper to read initial state from memory or localStorage
  const getCachedValue = (): T | undefined => {
    if (!key) return initialData;

    // Check in-memory cache first
    const mem = memoryCache.get(key);
    if (mem && mem.data !== undefined) {
      return mem.data as T;
    }

    // Check localStorage fallback
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const item = localStorage.getItem(storageKey);
        if (item) {
          const parsed = JSON.parse(item);
          memoryCache.set(key, { data: parsed, timestamp: Date.now() });
          return parsed as T;
        }
      } catch (e) {
        // Storage access fallback
      }
    }

    return initialData;
  };

  const [data, setData] = useState<T>(() => {
    const cached = getCachedValue();
    return cached !== undefined ? cached : (initialData as T);
  });

  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Core revalidation logic
  const revalidate = useCallback(
    async (force = false) => {
      if (!key) return;

      const now = Date.now();
      if (!force && now - lastFetchTimeRef.current < dedupingInterval) {
        return; // Skip if within deduping interval
      }

      lastFetchTimeRef.current = now;
      setIsValidating(true);

      try {
        const fresh = await fetcherRef.current();

        if (isMountedRef.current) {
          // Check if data actually changed to avoid unnecessary re-renders
          const hasChanged = JSON.stringify(fresh) !== JSON.stringify(data);
          if (hasChanged) {
            setData(fresh);
          }
          setError(null);
        }

        // Update memory cache
        memoryCache.set(key, { data: fresh, timestamp: now });

        // Update localStorage
        if (typeof window !== 'undefined' && storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(fresh));
          } catch (e) {
            // Ignore quota errors
          }
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          console.warn(`[SWR] Revalidation failed for ${key}, preserving stale cache:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMountedRef.current) {
          setIsValidating(false);
        }
      }
    },
    [key, data, dedupingInterval, storageKey]
  );

  // Mutate local cache and state
  const mutate = useCallback(
    async (newData?: T | ((current: T) => T), shouldRevalidate = true) => {
      if (!key) return;

      if (newData !== undefined) {
        const resolved = typeof newData === 'function' ? (newData as (current: T) => T)(data) : newData;
        setData(resolved);
        memoryCache.set(key, { data: resolved, timestamp: Date.now() });
        if (typeof window !== 'undefined' && storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(resolved));
          } catch (e) {}
        }
      }

      if (shouldRevalidate) {
        await revalidate(true);
      }
    },
    [key, data, storageKey, revalidate]
  );

  // Initial mount & key change effect
  useEffect(() => {
    isMountedRef.current = true;

    // Check if cache has updated in another instance
    const cached = getCachedValue();
    if (cached !== undefined && JSON.stringify(cached) !== JSON.stringify(data)) {
      setData(cached);
    }

    // Always revalidate in background upon mount
    revalidate();

    return () => {
      isMountedRef.current = false;
    };
  }, [key]);

  // Window Focus / Visibility Change Revalidation
  useEffect(() => {
    if (!revalidateOnFocus || !key) return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        revalidate();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [revalidateOnFocus, key, revalidate]);

  return {
    data,
    error,
    isValidating,
    mutate,
  };
}
